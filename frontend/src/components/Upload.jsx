import { useState } from 'react'

const Upload = ({ token, onUpload, onLogout }) => {
    const [file, setFile] = useState(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [isStreaming, setIsStreaming] = useState(false)

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0]
        if (selectedFile && selectedFile.type !== 'application/pdf') {
            setError('Only PDF files are allowed')
            setFile(null)
        } else {
            setError('')
            setFile(selectedFile)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!file) return
        setLoading(true)
        setError('')

        // Create AudioContext inside user gesture
        const AudioContext = window.AudioContext || window.webkitAudioContext
        const audioContext = new AudioContext()

        const formData = new FormData()
        formData.append('file', file)

        try {
            const res = await fetch('/upload-story', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            })
            if (!res.ok) throw new Error('Upload failed')
            const data = await res.json()
            onUpload(data.story_id, audioContext, isStreaming)
        } catch (err) {
            setError('Failed to upload story')
            audioContext.close()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h2>Upload Story</h2>
                <button onClick={onLogout} style={{ fontSize: '0.8rem', padding: '0.4rem' }}>Logout</button>
            </div>

            <form onSubmit={handleSubmit} style={{ border: '2px dashed #444', padding: '2rem', borderRadius: '8px' }}>
                <div className='input-container'>
                    <input
                        type="file"
                        accept=".pdf"
                        onChange={handleFileChange}
                        required
                        style={{ background: 'transparent', border: 'none' }}
                    />

                    <label className="switch">
                        {isStreaming ? "Streaming" : "Non-Streaming"}
                        <input
                            type="checkbox"
                            checked={isStreaming}
                            onChange={(e) => setIsStreaming(e.target.checked)}
                        />
                    </label>
                </div>

                <button type="submit" disabled={loading || !file} style={{ marginTop: '1rem', width: '100%' }}>
                    {loading ? 'Processing...' : 'Upload & Play'}
                </button>
            </form>
            {error && <p className="error">{error}</p>}
        </div>
    )
}

export default Upload
