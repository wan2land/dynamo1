import { fromDynamo, fromDynamoMap } from './from-dynamo'

describe('testsuite of utils/from-dynamo', () => {

  it('test fromDynamo null', () => {
    expect(fromDynamo({ NULL: true })).toEqual(null)
  })

  it('test fromDynamo string', () => {
    expect(fromDynamo({ S: 'string!' })).toEqual('string!')
  })

  it('test fromDynamo number', () => {
    expect(fromDynamo({ N: '1010' })).toEqual(1010)
    expect(fromDynamo({ N: '3.14' })).toEqual(3.14)
  })

  it('test fromDynamo boolean', () => {
    expect(fromDynamo({ BOOL: true })).toEqual(true)
    expect(fromDynamo({ BOOL: false })).toEqual(false)
  })

  it('test fromDynamo buffer', () => {
    expect(fromDynamo({ B: Buffer.from('buffer') })).toEqual(Buffer.from('buffer'))
  })

  it('test fromDynamo array', () => {
    expect(fromDynamo({ L: [
      { NULL: true },
      { N: '1' },
      { S: 'string' },
      { BOOL: true },
      { BOOL: false },
      { B: Buffer.from('buffer') },
    ] })).toEqual([null, 1, 'string', true, false, Buffer.from('buffer')])
  })

  it('test fromDynamo object', () => {
    expect(fromDynamo({ M: {
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    } })).toEqual({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })
  })

  it('test fromDynamoMap', () => {
    expect(fromDynamoMap({
      null: { NULL: true },
      number: { N: '1' },
      string: { S: 'string' },
      true: { BOOL: true },
      false: { BOOL: false },
      buffer: { B: Buffer.from('buffer') },
    })).toEqual({ null: null, number: 1, string: 'string', true: true, false: false, buffer: Buffer.from('buffer') })
  })
})
