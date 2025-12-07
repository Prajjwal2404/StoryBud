import { useState } from 'react'

const Login = ({ onLogin, onSwitch }) => {
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        const formData = new FormData()
        formData.append('username', username)
        formData.append('password', password)

        try {
            const res = await fetch('/token', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) throw new Error('Login failed')
            const data = await res.json()
            onLogin(data.access_token)
        } catch (err) {
            setError('Invalid username or password')
        }
    }

    return (
        <div className="card">
            <h2>Login</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                <button type="submit">Login</button>
            </form>
            {error && <p className="error">{error}</p>}
            <button className="link-btn" onClick={onSwitch}>
                Don't have an account? Register
            </button>
        </div>
    )
}

export default Login
