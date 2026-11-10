import {FormattedMessage} from "react-intl";
import {Button} from "react-bootstrap";

export default function GitHubReference(){
    return (
        <div>
            <p className="fs-5">
                <FormattedMessage
                    id="githubreference.githubInvite"
                    defaultMessage="Would you like to help shape this project? The source code is available on GitHub, and we welcome contributions, ideas, and feedback."
                />
            </p>
            <Button
            as="a"
            href="https://github.com/makerverse-fhnw/cookiecaster"
            target="_blank"
            rel="noopener noreferrer"
            variant="primary"
            className="d-inline-flex align-items-center gap-2"
            >
                <img src={`${import.meta.env.BASE_URL}/assets/github.svg`} alt="" width={18} height={18} />

                <FormattedMessage
                    id="githubreference.opensourceButton"
                    defaultMessage="Contribute on GitHub"
                />
            </Button>
        </div>

    );
}