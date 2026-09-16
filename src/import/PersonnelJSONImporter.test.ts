import { describe, expect, it } from 'vitest'
import { PersonnelJSONImporter } from './PersonnelJSONImporter'
import type { Personnel } from '../models/types'

const existing: Personnel[] = [{ id: '1', sicilNo: '1001', ad: 'EMİN', soyad: 'BOYACI' }]

describe('PersonnelJSONImporter', () => {
  it('geçerli JSON içindeki yeni ve mevcut kaydı ayırır', () => {
    const preview = new PersonnelJSONImporter().preview('[{"sicilNo":"1001","ad":"EMİN","soyad":"BOYACI"},{"sicilNo":"1002","ad":"MEHMET","soyad":"YILMAZ"}]', existing)
    expect(preview.existingCount).toBe(1); expect(preview.newCount).toBe(1)
  })
  it('bozuk JSON için anlaşılır hata verir', () => {
    expect(() => new PersonnelJSONImporter().preview('{bozuk', [])).toThrow('JSON DOSYASI OKUNAMADI')
  })
  it('ad veya soyad eksikse kaydı hatalı yapar', () => {
    const preview = new PersonnelJSONImporter().preview('[{"ad":"","soyad":"A"},{"ad":"A","soyad":""}]', [])
    expect(preview.invalidCount).toBe(2)
  })
})
