from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, WebSocket, WebSocketDisconnect
from starlette.websockets import WebSocketState
import asyncio
import numpy as np
from backend import models, auth, pdf_processor
from ..services import story_store
from ..services.voxcpm_service import voxcpm_service


router = APIRouter(tags=["story"])

@router.post("/upload-story")
async def upload_story(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user)):
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="File must be a PDF")
        
    content = await file.read()
    try:
        text = pdf_processor.extract_text_from_pdf(content)
        chunks = pdf_processor.chunk_text(text)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error processing PDF: {str(e)}")
    
    story_id = f"{current_user.username}_{file.filename}"
    story_store.save_story_chunks(story_id, chunks)
    
    return {"story_id": story_id, "message": "Story uploaded and processed. Connect to WebSocket to stream audio.", "chunks_count": len(chunks)}

@router.websocket("/ws/story/{story_id}")
async def websocket_endpoint(websocket: WebSocket, story_id: str, stream: bool = False):
    await websocket.accept()
    
    if not story_store.has_story(story_id):
        await websocket.close(code=1008, reason="Story not found")
        return

    chunks = story_store.get_story_chunks(story_id)
    model = voxcpm_service.get_model()
    
    try:
        for i, chunk in enumerate(chunks):
            if websocket.client_state == WebSocketState.DISCONNECTED:
                break

            await websocket.send_json({"type": "text_chunk", "index": i, "text": chunk})
            await asyncio.sleep(0)
            
            if stream:
                audio_generator = model.generate_streaming(text=chunk)
                
                for audio_chunk in audio_generator:
                    if websocket.client_state == WebSocketState.DISCONNECTED:
                        break

                    audio_int16 = (audio_chunk * 32767).astype(np.int16)
                    audio_bytes = audio_int16.tobytes()
                    
                    await websocket.send_bytes(audio_bytes)
                    await asyncio.sleep(0)
            else:
                audio_generator = model.generate_streaming(text=chunk)
                audio_parts = []
                
                for audio_chunk in audio_generator:
                    if websocket.client_state == WebSocketState.DISCONNECTED:
                        break
                    audio_parts.append(audio_chunk)
                    await asyncio.sleep(0)

                if audio_parts:
                    audio = np.concatenate(audio_parts)
                    audio_int16 = (audio * 32767).astype(np.int16)
                    audio_bytes = audio_int16.tobytes()
                    await websocket.send_bytes(audio_bytes)

            model.reset()

        if websocket.client_state != WebSocketState.DISCONNECTED:
            await websocket.send_json({"type": "status", "status": "completed"})
        
    except WebSocketDisconnect:
        print(f"Client disconnected for story {story_id}")
    except Exception as e:
        print(f"Error streaming story: {e}")