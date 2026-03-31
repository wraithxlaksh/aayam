import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SuperstarContainer from './SuperstarContainer'
import PublicLeaderboard from './PublicLeaderboard'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/leaderboard" element={<PublicLeaderboard />} />
        <Route path="/*" element={<SuperstarContainer />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
