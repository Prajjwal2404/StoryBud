import { useState, useEffect } from 'react'
import Login from './components/Login'
import Register from './components/Register'
import Upload from './components/Upload'
import Player from './components/Player'

function App() {
    const [token, setToken] = useState(localStorage.getItem('token'))
    const [view, setView] = useState(token ? 'upload' : 'login')
    const [storyId, setStoryId] = useState(null)
    const [audioCtx, setAudioCtx] = useState(null)
    const [isStreaming, setIsStreaming] = useState(false)

    useEffect(() => {
        if (token) {
            setView('upload')
        } else {
            setView('login')
        }
    }, [token])

    const handleLogin = (newToken) => {
        localStorage.setItem('token', newToken)
        setToken(newToken)
    }

    const handleLogout = () => {
        localStorage.removeItem('token')
        setToken(null)
        setView('login')
        if (audioCtx) {
            audioCtx.close()
            setAudioCtx(null)
        }
    }

    return (
        <div>
            <h1>StoryBud</h1>
            {view === 'login' && (
                <Login onLogin={handleLogin} onSwitch={() => setView('register')} />
            )}
            {view === 'register' && (
                <Register onLogin={handleLogin} onSwitch={() => setView('login')} />
            )}
            {view === 'upload' && (
                <Upload
                    token={token}
                    onUpload={(id, ctx, streaming) => {
                        setStoryId(id)
                        setAudioCtx(ctx)
                        setIsStreaming(streaming)
                        setView('player')
                    }}
                    onLogout={handleLogout}
                />
            )}
            {view === 'player' && (
                <Player
                    token={token}
                    storyId={storyId}
                    audioContext={audioCtx}
                    isStreaming={isStreaming}
                    onBack={() => {
                        if (audioCtx) audioCtx.close()
                        setAudioCtx(null)
                        setView('upload')
                    }}
                />
            )}
        </div>
    )
}

export default App
