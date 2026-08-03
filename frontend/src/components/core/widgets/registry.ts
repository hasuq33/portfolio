import { TextWidget } from "./text";
import { TextAreaWidget } from "./textArea";
import { BooleanWidget } from "./boolean";
import { SelectWidget } from "./select";
import { ImageWidget } from "./image";

export const WidgetRegistry = {
    text: TextWidget,
    email: TextWidget,
    password: TextWidget,
    url: TextWidget,
    color: TextWidget,
    textarea: TextAreaWidget,
    switch: BooleanWidget,
    select: SelectWidget,
    image: ImageWidget,
}
