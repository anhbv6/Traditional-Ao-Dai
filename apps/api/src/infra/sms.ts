export interface SmsProvider {
  sendSms(phone: string, message: string): Promise<boolean>
}

export class MockSmsProvider implements SmsProvider {
  async sendSms(phone: string, message: string): Promise<boolean> {
    console.log(`\n================ MOCK SMS PROVIDER ================`)
    console.log(`To: ${phone}`)
    console.log(`Message: ${message}`)
    console.log(`===================================================\n`)
    return true
  }
}

export const smsProvider = new MockSmsProvider()
