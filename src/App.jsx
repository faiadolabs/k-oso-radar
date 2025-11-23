import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

import Radar from "./components/Radar"

function App() {
  const [count, setCount] = useState(0)
  const [points, setPoints] = useState([
    { rKm: 20, angle: 45, color: "#00ff00" },
    { rKm: 40, angle: 120, color: "#ff0000" }
  ])

  return (
    <>
      <div>
        <h1>k-oso radar</h1>
      </div>
      <div>
        <Radar points={points} rangeKm={100} pixelsPerKm={5} />
      </div>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>
    </>
  )
}

export default App
