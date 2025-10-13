import { Button, DatePicker, Space } from 'antd'

function App() {
  return (
    <div style={{ padding: '50px' }}>
      <Space direction="vertical">
        <h1>tesis con React + Vite + Ant Design</h1>
        <Button type="primary">Botón Principal</Button>
        <DatePicker />
      </Space>
    </div>
  )
}

export default App