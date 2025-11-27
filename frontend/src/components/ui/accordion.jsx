import * as React from "react"
import { ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"

const AccordionContext = React.createContext({})
const AccordionItemContext = React.createContext({})

const Accordion = React.forwardRef(({ className, type = "single", defaultValue, children, ...props }, ref) => {
  const [value, setValue] = React.useState(defaultValue || (type === "multiple" ? [] : ""))

  const handleValueChange = (itemValue) => {
    if (type === "single") {
      setValue(prev => prev === itemValue ? "" : itemValue)
    } else {
      setValue(prev => {
        const arr = Array.isArray(prev) ? prev : []
        return arr.includes(itemValue) 
          ? arr.filter(v => v !== itemValue)
          : [...arr, itemValue]
      })
    }
  }

  return (
    <AccordionContext.Provider value={{ value, onValueChange: handleValueChange, type }}>
      <div ref={ref} className={cn("", className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  )
})
Accordion.displayName = "Accordion"

const AccordionItem = React.forwardRef(({ className, value, ...props }, ref) => {
  return (
    <AccordionItemContext.Provider value={{ value }}>
      <div ref={ref} className={cn("border-b", className)} {...props} />
    </AccordionItemContext.Provider>
  )
})
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value: selectedValue, onValueChange, type } = React.useContext(AccordionContext)
  const { value: itemValue } = React.useContext(AccordionItemContext)
  
  const isOpen = type === "single" 
    ? selectedValue === itemValue 
    : (Array.isArray(selectedValue) && selectedValue.includes(itemValue))

  return (
    <div className="flex">
      <button
        ref={ref}
        onClick={() => onValueChange(itemValue)}
        className={cn(
          "flex flex-1 items-center justify-between py-4 font-medium transition-all hover:underline [&[data-state=open]>svg]:rotate-180",
          className
        )}
        data-state={isOpen ? "open" : "closed"}
        {...props}
      >
        {children}
        <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200" />
      </button>
    </div>
  )
})
AccordionTrigger.displayName = "AccordionTrigger"

const AccordionContent = React.forwardRef(({ className, children, ...props }, ref) => {
  const { value: selectedValue, type } = React.useContext(AccordionContext)
  const { value: itemValue } = React.useContext(AccordionItemContext)
  
  const isOpen = type === "single" 
    ? selectedValue === itemValue 
    : (Array.isArray(selectedValue) && selectedValue.includes(itemValue))

  if (!isOpen) return null

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden text-sm transition-all",
        className
      )}
      data-state={isOpen ? "open" : "closed"}
      {...props}
    >
      <div className="pb-4 pt-0">{children}</div>
    </div>
  )
})
AccordionContent.displayName = "AccordionContent"

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
