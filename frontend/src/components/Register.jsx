import { useState } from 'react'

const Register = ({ onLogin, onSwitch }) => {
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
            const res = await fetch('/users/', {
                method: 'POST',
                body: formData,
            })
            if (!res.ok) {
                const data = await res.json()
                throw new Error(data.detail || 'Registration failed')
            }
            // Auto login after register
            const loginRes = await fetch('/token', {
                method: 'POST',
                body: formData,
            })
            if (!loginRes.ok) throw new Error('Login failed after registration')
            const data = await loginRes.json()
            onLogin(data.access_token)
        } catch (err) {
            setError(err.message)
        }
    }

    return (
        <div className="card">
            <h2>Register</h2>
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
                <button type="submit">Register</button>
            </form>
            {error && <p className="error">{error}</p>}
            <button className="link-btn" onClick={onSwitch}>
                Already have an account? Login
            </button>
        </div>
    )
}

export default Register
