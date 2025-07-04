"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { languages, fileTypesByLanguage } from "@/lib/initial-data";
import type { Language, FileType } from "@/lib/types";
import { ScrollArea } from "@/components/ui/scroll-area";

const formSchema = z.object({
  name: z.string().min(1, "Name is required."),
  itemType: z.enum(['file', 'folder']),
  language: z.enum(languages as [Language, ...Language[]]).optional(),
}).refine(data => {
    if (data.itemType === 'file' && !data.language) {
      return false;
    }
    return true;
  }, {
    message: 'Language is required for files.',
    path: ['language'],
  });

interface NewFileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onItemCreate: (name: string, itemType: 'file' | 'folder', language: Language | null, type: FileType | null) => void;
}

export function NewFileDialog({ open, onOpenChange, onItemCreate }: NewFileDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      itemType: "file",
      language: "C++",
    },
  });

  const itemType = form.watch("itemType");

  function onSubmit(values: z.infer<typeof formSchema>) {
    const { name, itemType, language } = values;
    if (itemType === 'file' && language) {
        const fileType = fileTypesByLanguage[language];
        onItemCreate(name, 'file', language, fileType);
    } else {
        onItemCreate(name, 'folder', null, null);
    }
    form.reset();
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] flex flex-col max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Create New Item</DialogTitle>
          <DialogDescription>
            Create a new file or folder in your project.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-1 -mx-6">
          <div className="px-6 py-4">
            <Form {...form}>
              <form id="new-item-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                <FormField
                  control={form.control}
                  name="itemType"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <FormLabel>Item Type</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex space-x-4"
                        >
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="file" />
                            </FormControl>
                            <FormLabel className="font-normal">File</FormLabel>
                          </FormItem>
                          <FormItem className="flex items-center space-x-2 space-y-0">
                            <FormControl>
                              <RadioGroupItem value="folder" />
                            </FormControl>
                            <FormLabel className="font-normal">Folder</FormLabel>
                          </FormItem>
                        </RadioGroup>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{itemType === 'file' ? 'Filename' : 'Folder Name'}</FormLabel>
                      <FormControl>
                        <Input placeholder={itemType === 'file' ? 'e.g., my-component.tsx' : 'e.g., components'} {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {itemType === 'file' && (
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Language</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select a language" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {languages.map((lang) => (
                              <SelectItem key={lang} value={lang}>
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
              </form>
            </Form>
          </div>
        </ScrollArea>
        <DialogFooter className="pt-4 border-t">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" form="new-item-form">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
