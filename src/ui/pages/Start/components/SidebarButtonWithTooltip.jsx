import {OverlayTrigger, Tooltip} from "react-bootstrap";
import {FormattedMessage} from "react-intl";

export default function SidebarButtonWithTooltip({id, msgId, children, placement = "right", ...props}) {
    return (
        <OverlayTrigger
            placement={placement}
            overlay={
                <Tooltip id={`tooltip-${id}`}>
                    <FormattedMessage id={msgId}/>
                </Tooltip>
            }
        >
            <button className="ps-0" id={id} {...props}> {children} </button>
        </OverlayTrigger>
    );
}
