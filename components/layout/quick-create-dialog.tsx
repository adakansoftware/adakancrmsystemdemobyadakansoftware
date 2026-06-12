'use client'

import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

type QuickCreateDialogProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const owners = ['Elif Yılmaz', 'Burak Demir', 'Zeynep Kaya', 'Mert Şahin']

export function QuickCreateDialog({
  open,
  onOpenChange,
}: QuickCreateDialogProps) {
  function handleSave() {
    onOpenChange(false)
    toast.success('Kayıt oluşturuldu', {
      description: 'Yeni kayıt başarıyla eklendi.',
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Hızlı Oluştur</DialogTitle>
          <DialogDescription>
            Yeni bir kayıt ekleyin. Tüm alanları doldurmanız gerekmez.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="lead">
          <TabsList className="w-full">
            <TabsTrigger value="lead">Lead</TabsTrigger>
            <TabsTrigger value="deal">Anlaşma</TabsTrigger>
            <TabsTrigger value="task">Görev</TabsTrigger>
          </TabsList>
        </Tabs>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="qc-name">Ad Soyad / Başlık</FieldLabel>
            <Input id="qc-name" placeholder="Örn. Caner Aydın" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="qc-company">Firma</FieldLabel>
              <Input id="qc-company" placeholder="Firma adı" />
            </Field>
            <Field>
              <FieldLabel htmlFor="qc-phone">Telefon</FieldLabel>
              <Input id="qc-phone" placeholder="+90 5__ ___ __ __" />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel>Kaynak</FieldLabel>
              <Select defaultValue="Website">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="Website">Website</SelectItem>
                    <SelectItem value="WhatsApp">WhatsApp</SelectItem>
                    <SelectItem value="Referans">Referans</SelectItem>
                    <SelectItem value="Telefon">Telefon</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel>Sorumlu</FieldLabel>
              <Select defaultValue={owners[0]}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {owners.map((owner) => (
                      <SelectItem key={owner} value={owner}>
                        {owner}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          </div>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
