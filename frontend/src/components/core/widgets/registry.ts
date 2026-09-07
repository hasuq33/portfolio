import { TextWidget } from "./text";
import { TextAreaWidget } from "./textArea";
import { BooleanWidget } from "./boolean";
import { SelectWidget } from "./select";
import { ImageWidget } from "./image";
import { TagsWidget } from "./tags";
import { ManyToManyWidget } from "./many2many";
import { MultiSelectWidget } from "./multi-select";
import { AccessRightsWidget } from "./access-rights";
import { HtmlWidget } from "./html";
import { ToggleWidget } from "./toggle";
import { CoverImageWidget } from "./cover-image";

export const WidgetRegistry = {
    text: TextWidget,
    email: TextWidget,
    password: TextWidget,
    url: TextWidget,
    color: TextWidget,
    textarea: TextAreaWidget,
    html: HtmlWidget,
    switch: BooleanWidget,
    select: SelectWidget,
    image: ImageWidget,
    "cover-image": CoverImageWidget,
    toggle: ToggleWidget,
    tel: TextWidget,
    date: TextWidget,
    tags: TagsWidget,
    many2many: ManyToManyWidget,
    "multi-select": MultiSelectWidget,
    "access-rights": AccessRightsWidget,
}
