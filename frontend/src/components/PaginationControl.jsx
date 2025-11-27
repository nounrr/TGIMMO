import React from 'react';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

export function PaginationControl({ 
  currentPage, 
  lastPage, 
  perPage, 
  onPageChange, 
  onPerPageChange, 
  total, 
  from, 
  to 
}) {
  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (lastPage <= maxVisible) {
      for (let i = 1; i <= lastPage; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 3; i++) pages.push(i);
        pages.push('...');
        pages.push(lastPage);
      } else if (currentPage >= lastPage - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = lastPage - 2; i <= lastPage; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(lastPage);
      }
    }
    return pages;
  };

  return (
    <div className="flex flex-col md:flex-row items-center justify-between px-4 py-4 border-t gap-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <span>Affichage de {from || 0} à {to || 0} sur {total || 0} résultats</span>
        <div className="flex items-center gap-2 ml-4">
          <span>Par page:</span>
          <Select 
            value={String(perPage)} 
            onValueChange={(v) => onPerPageChange(Number(v))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={perPage} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="15">15</SelectItem>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1}
        >
          <ChevronsLeft className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1 mx-2">
          {getPageNumbers().map((p, i) => (
            p === '...' ? (
              <span key={i} className="px-2 text-muted-foreground">...</span>
            ) : (
              <Button
                key={i}
                variant={currentPage === p ? "default" : "outline"}
                size="sm"
                className="h-8 w-8 p-0"
                onClick={() => onPageChange(p)}
              >
                {p}
              </Button>
            )
          ))}
        </div>

        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === lastPage}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onPageChange(lastPage)}
          disabled={currentPage === lastPage}
        >
          <ChevronsRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
