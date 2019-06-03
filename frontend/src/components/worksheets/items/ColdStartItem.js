// @flow
import * as React from 'react';
import Button from '@material-ui/core/Button';
import { withStyles } from '@material-ui/core/styles';
import AddIcon from '@material-ui/icons/PlayCircleFilled';

import NewRun from '../NewRun';
import NewUpload from '../NewUpload';
import TextEditorItem from './TextEditorItem';

class InsertButtons extends React.Component<{
    classes: {},
    showNewUpload: () => void,
    showNewRun: () => void,
    showNewText: () => void,
}> {
    render() {
        const { classes, showNewUpload, showNewRun, showNewText } = this.props;
        return (
            <div className={classes.buttonsPanel}>
                <Button
                    variant='outlined'
                    size='small'
                    color='primary'
                    aria-label='Upload'
                    onClick={showNewUpload}
                    classes={{ root: classes.buttonRoot }}
                >
                    <AddIcon className={classes.buttonIcon} />
                    Upload
                </Button>
                <Button
                    variant='outlined'
                    size='small'
                    color='primary'
                    aria-label='Add New Run'
                    onClick={showNewRun}
                    classes={{ root: classes.buttonRoot }}
                >
                    <AddIcon className={classes.buttonIcon} />
                    Run
                </Button>
                <Button
                    variant='outlined'
                    size='small'
                    color='primary'
                    aria-label='Add Text'
                    onClick={showNewText}
                    classes={{ root: classes.buttonRoot }}
                >
                    <AddIcon className={classes.buttonIcon} />
                    Text
                </Button>
            </div>
        );
    }
}

class ColdStartItem extends React.Component {

	state = {
		showNewText: false,
		showNewRun: false,
		showNewUpload: false,
	}

	render() {
		const { classes, ws, worksheetUUID, reloadWorksheet } = this.props;
		const { showNewText, showNewRun, showNewUpload } = this.state;

		return (
			<div className={ classes.container }>
				<InsertButtons
		            classes={classes}
		            showNewUpload={() => {
		                this.setState({ showNewUpload: true });
		            }}
		            showNewRun={() => {
		                this.setState({ showNewRun: true });
		            }}
		            showNewText={() => {
		                this.setState({ showNewText: true });
		            }}
		        />
				{showNewUpload && (
	                <NewUpload
	                    worksheetUUID={worksheetUUID}
	                    reloadWorksheet={reloadWorksheet}
	                    onClose={() => this.setState({ showNewUpload: 0 })}
	                />
	            )}
	            {showNewRun && (
	                <NewRun
	                    ws={ws}
	                    onSubmit={() => this.setState({ showNewRun: 0 })}
	                />
	            )}
	            {showNewText && (
	                <TextEditorItem
	                    mode="create"
	                    worksheetUUID={worksheetUUID}
	                    reloadWorksheet={reloadWorksheet}
	                    closeEditor={() => {
	                        this.setState({ showNewText: 0 });
	                    }}
	                />
	            )}
        	</div>
		);
	}
}

const styles = (theme) => ({
	container: {
		width: '100%',
	},
	buttonsPanel: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'center',
        width: '100%',
    },
    buttonRoot: {
        width: 120,
        height: 32,
        marginLeft: theme.spacing.unit,
        marginRight: theme.spacing.unit,
        backgroundColor: '#f7f7f7',
        '&:hover': {
            backgroundColor: '#f7f7f7',
        },
    },
});

export default withStyles(styles)(ColdStartItem);