import {Button} from "react-bootstrap";
import {Link} from "react-router-dom";

export default function DrawerItem({children, onButtonClick, to, closeDrawer, id, className, disabled}) {
    const mergedClassName = ["drawer-item", className].filter(Boolean).join(" ");

    if (to) {
        return (
            <div>
                <Button
                    as={Link}
                    to={to}
                    variant="primary"
                    className={mergedClassName}
                    onClick={() => closeDrawer(false)}
                    id={id}
                    disabled={disabled}
                >
                    {children}
                </Button>
            </div>
        );
    }

    return (
        <div>
            <Button
                className={mergedClassName}
                variant="primary"
                onClick={() => onButtonClick()}
                id={id}
                disabled={disabled}
            >
                {children}
            </Button>
        </div>
    );
}