import { Link, Popover, PopoverContent, PopoverTrigger } from "@nextui-org/react";

export default function Tooltip(props: any) {
    return (
        <Popover placement="bottom">
            <PopoverTrigger>
                <Link className="mx-3" href="#">
                    ?
                </Link>
            </PopoverTrigger>
            <PopoverContent>
                <div className="px-1 py-2">
                    <div className="text-small font-bold">{props.title}</div>
                    <div className="text-tiny">{props.content}</div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
