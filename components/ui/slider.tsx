"use client";

import * as SliderPrimitive from "@radix-ui/react-slider";

import { cn } from "@/lib/utils";

const Slider = ({
  className,
  ...props
}: SliderPrimitive.SliderProps) => (
  <SliderPrimitive.Root
    className={cn("relative flex w-full touch-none select-none items-center", className)}
    {...props}
  >
    <SliderPrimitive.Track className="relative h-2 grow overflow-hidden rounded-full bg-white/8">
      <SliderPrimitive.Range className="absolute h-full bg-amber-400/80" />
    </SliderPrimitive.Track>
    <SliderPrimitive.Thumb className="block h-5 w-5 rounded-full border border-white/20 bg-white shadow transition hover:scale-110 focus:outline-none focus:ring-2 focus:ring-amber-300" />
  </SliderPrimitive.Root>
);

export { Slider };
