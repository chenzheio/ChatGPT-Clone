// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { createParser, ParsedEvent, ReconnectInterval } from 'eventsource-parser'
import type { NextApiRequest, NextApiResponse } from 'next'
import { Message } from '..'

const generatePayload = (apiKey: string, messages: Message[]): RequestInit => ({
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  method: 'POST',
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages,
    temperature: 0.6,
    stream: true,
  }),
})

const parseOpenAIStream = (rawResponse: Response) => {
  const encoder = new TextEncoder()
  const decoder = new TextDecoder()
  const stream = new ReadableStream({
    async start(controller) {
      const streamParser = (event: ParsedEvent | ReconnectInterval) => {
        if (event.type === 'event') {
          const data = event.data
          if (data === '[DONE]') {
            controller.close()
            return
          }
          try {
            const json = JSON.parse(data)
            const text = json.choices[0].delta?.content || ''
            const queue = encoder.encode(text)
            controller.enqueue(queue)
          } catch (e) {
            controller.error(e)
          }
        }
      }

      const parser = createParser(streamParser)
      for await (const chunk of rawResponse.body as any) {
        parser.feed(decoder.decode(chunk))
      }
    },
  })

  return stream
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {

  const { messages }: { messages: Message[] } = req.body

  const API_KEY = process.env.OPENAI_API_KEY || ""
  if (!API_KEY) {
    res.status(500).send("尚未设置 OPENAI_API_KEY")
    return
  }

  const request = generatePayload(API_KEY, messages)

  const response = await fetch("https://api.openai.com/v1/chat/completions", request)
  const stream = parseOpenAIStream(response)
  const reader = stream.getReader()
  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      break
    }
    res.write(value)
  }
  res.end()
}


