import app from './app'
import { env } from './config/env'
import { startBusSimulator } from './jobs/busSimulator'

app.listen(env.port, () => {
  console.log(`สายเลข API (TypeScript) พร้อมใช้งานที่ port ${env.port}`)

  if (env.enableBusSimulator) {
    startBusSimulator().catch((err) => console.error('[bus-simulator] เริ่มทำงานไม่สำเร็จ', err))
  }
})
