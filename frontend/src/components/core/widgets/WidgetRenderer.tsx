'use client';

import { WidgetRegistry } from "./registry";
import { WidgetProps } from "./types";

interface RendererProps extends WidgetProps{
    widget: keyof typeof WidgetRegistry;
}

const WidgetRenderer = ({widget , ...props}: RendererProps) =>{
    const Component = WidgetRegistry[widget];

    if(!Component){
        return (<div>
            Widget "{widget}" not found
        </div>)
    }

    return <Component {...props}/>
}

export default WidgetRenderer;