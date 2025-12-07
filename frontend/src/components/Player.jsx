import { useState, useEffect, useRef } from 'react'

const Player = ({ token, storyId, audioContext, isStreaming, onBack }) => {
    const [text, setText] = useState('Waiting for audio...')
    const [status, setStatus] = useState('Connecting...')
    const [isWaiting, setIsWaiting] = useState(true)

    const audioContextRef = useRef(null)
    const wsRef = useRef(null)
    const nextStartTimeRef = useRef(0)
    const isPlayingRef = useRef(false)
    const isFinishedRef = useRef(false)

    const pendingTextRef = useRef(null)
    const nextAudioStartsNewTextRef = useRef(false)

    useEffect(() => {
        audioContextRef.current = audioContext

        // Reset state on reconnect
        setText('Waiting for audio...')
        setStatus('Connecting...')
        setIsWaiting(true)
        isFinishedRef.current = false
        nextStartTimeRef.current = 0
        pendingTextRef.current = null
        nextAudioStartsNewTextRef.current = false

        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
        const wsUrl = `${protocol}//${window.location.host}/ws/story/${storyId}?stream=${isStreaming}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws
        ws.binaryType = 'arraybuffer'

        ws.onopen = () => {
            setStatus('Connected. Generating...')
            isPlayingRef.current = true
        }

        ws.onmessage = async (event) => {
            if (typeof event.data === 'string') {
                const data = JSON.parse(event.data)
                if (data.type === 'text_chunk') {
                    // Queue the text
                    pendingTextRef.current = data.text
                    nextAudioStartsNewTextRef.current = true
                    setStatus('Generating audio...')
                } else if (data.type === 'status' && data.status === 'completed') {
                    setStatus('Finished.')
                    isFinishedRef.current = true
                }
            } else if (event.data instanceof ArrayBuffer) {
                setStatus('Playing...')
                playAudioChunk(event.data)
            }
        }

        ws.onclose = () => {
            if (!isFinishedRef.current) {
                setStatus('Disconnected.')
            }
            isPlayingRef.current = false
            setIsWaiting(false)
        }

        return () => {
            if (wsRef.current) wsRef.current.close()
        }
    }, [storyId, audioContext, isStreaming])

    // Interval to check for buffering/waiting state
    useEffect(() => {
        const interval = setInterval(() => {
            const ctx = audioContextRef.current
            if (!ctx) return

            if (isFinishedRef.current) {
                setIsWaiting(false)
                return
            }

            // If current time is past the scheduled audio end time, we are waiting/buffering
            if (ctx.currentTime >= nextStartTimeRef.current - 0.05) {
                setIsWaiting(true)
                setStatus('Buffering...')
            } else {
                setIsWaiting(false)
                setStatus('Playing...')
            }
        }, 100)

        return () => clearInterval(interval)
    }, [])

    const playAudioChunk = (arrayBuffer) => {
        const ctx = audioContextRef.current
        if (!ctx) return

        if (ctx.state === 'suspended') {
            ctx.resume()
        }

        const int16Array = new Int16Array(arrayBuffer)
        const float32Array = new Float32Array(int16Array.length)
        for (let i = 0; i < int16Array.length; i++) {
            float32Array[i] = int16Array[i] / 32768.0
        }

        const audioBuffer = ctx.createBuffer(1, float32Array.length, 16000)
        audioBuffer.copyToChannel(float32Array, 0)

        const source = ctx.createBufferSource()
        source.buffer = audioBuffer
        source.connect(ctx.destination)

        const currentTime = ctx.currentTime
        if (nextStartTimeRef.current < currentTime) {
            nextStartTimeRef.current = currentTime + 0.1
        }

        // Sync text update
        if (nextAudioStartsNewTextRef.current && pendingTextRef.current) {
            const delay = Math.max(0, (nextStartTimeRef.current - currentTime) * 1000)
            const textToSet = pendingTextRef.current
            setTimeout(() => {
                setText(textToSet)
            }, delay)
            nextAudioStartsNewTextRef.current = false
        }

        source.start(nextStartTimeRef.current)
        nextStartTimeRef.current += audioBuffer.duration
    }

    const handleBack = () => {
        if (wsRef.current) {
            wsRef.current.close()
        }
        onBack()
    }

    return (
        <div className="card" style={{ maxWidth: '800px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', height: '24px' }}>
                    <h2>Now Playing</h2>
                    <div className="status">
                        {status}
                        {isWaiting && <div className="spinner"></div>}
                    </div>
                </div>
                <button onClick={handleBack} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>Back</button>
            </div>

            <div className="text-display">
                {text}
            </div>
        </div>
    )
}

export default Player