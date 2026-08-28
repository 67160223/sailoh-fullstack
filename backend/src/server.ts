import app from './app'
import { env } from './config/env'

app.listen(env.port, () => {
  console.log(`สายเลข API (TypeScript) พร้อมใช้งานที่ port ${env.port}`)
})
