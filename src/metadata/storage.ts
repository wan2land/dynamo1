import { MetadataColumn, MetadataEntity } from '../interfaces/metadata'

let storage: MetadataStorage | null = null

export class MetadataStorage {

  static clearGlobalStorage() {
    storage = null
  }

  static getGlobalStorage(): MetadataStorage {
    if (!storage) {
      storage = new MetadataStorage()
    }
    return storage
  }

  public entities = new Map<Function, MetadataEntity>()
  public columns = new Map<Function, MetadataColumn[]>()
}
