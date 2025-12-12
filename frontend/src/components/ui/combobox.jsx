import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Input } from "@/components/ui/input"

export function Combobox({ value, onValueChange, options, placeholder = "Sélectionner...", searchPlaceholder = "Rechercher...", emptyText = "Aucun résultat." }) {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [open, setOpen] = React.useState(false)

  const filteredOptions = React.useMemo(() => {
    if (!searchTerm) return options
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [options, searchTerm])

  const selectedLabel = React.useMemo(() => {
    const option = options.find(opt => opt.value === value)
    return option?.label || placeholder
  }, [value, options, placeholder])

  return (
    <div className="relative w-full">
      <Select value={value} onValueChange={onValueChange} open={open} onOpenChange={setOpen}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder}>{selectedLabel}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <div className="p-2 border-b">
            <Input
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-8"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          <div className="max-h-[300px] overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="py-6 text-center text-sm text-slate-500">{emptyText}</div>
            ) : (
              filteredOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  )
}
