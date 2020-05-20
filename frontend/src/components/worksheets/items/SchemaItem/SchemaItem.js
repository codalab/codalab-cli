// @flow
import * as React from 'react';
import { withStyles } from '@material-ui/core';
import Table from '@material-ui/core/Table';
import TableHead from '@material-ui/core/TableHead';
import TableBody from '@material-ui/core/TableBody';
import TableCell from './SchemaCell';
import TableRow from '@material-ui/core/TableRow';
import CheckIcon from '@material-ui/icons/Check';
import TextField from '@material-ui/core/TextField';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import IconButton from '@material-ui/core/IconButton';
import * as Mousetrap from '../../../../util/ws_mousetrap_fork';
import ArrowDropUpIcon from '@material-ui/icons/ArrowDropUp';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import DeleteSweepIcon from '@material-ui/icons/DeleteSweep';
import AddCircleIcon from '@material-ui/icons/AddCircle';
import EditIcon from '@material-ui/icons/Edit';
import ClearIcon from '@material-ui/icons/Clear';
import classNames from 'classnames';

class SchemaItem extends React.Component<{
    worksheetUUID: string,
    item: {},
    reloadWorksheet: () => any,
}> {
    /** Constructor. */
    constructor(props) {
        super(props);
        this.state = {
            showSchemaDetail: false,
            rows: [...this.props.item.field_rows],
            editing: false,
        };
    }

    toggleEdit = (clear, save) => () => {
        if (clear) {
            this.setState(
                { rows: [...this.props.item.field_rows], editing: !this.state.editing },
                () => {},
            );
            return;
        }
        this.setState({ editing: !this.state.editing });
        if (save) {
            let updatedSchema = [];
            this.state.rows.forEach((fields) => {
                if (!fields.field) {
                    return;
                }
                let curRow = '% add ' + fields.field;
                if (!fields['generated-path']) {
                    updatedSchema.push(curRow);
                    return;
                }
                curRow = curRow + ' ' + fields['generated-path'];
                if (!fields['post-processing']) {
                    updatedSchema.push(curRow);
                    return;
                }
                curRow = curRow + ' ' + fields['post-processing'];
                updatedSchema.push(curRow);
            });
            console.log(updatedSchema);
            this.props.updateSchemaItem(
                updatedSchema,
                this.props.item.start_index,
                this.props.item.field_rows.length,
            );
        }
    };

    addFieldRowAfter = (idx) => (e) => {
        let newRow = {};
        const schemaItem = this.props.item;
        const schemaHeaders = schemaItem.header;
        schemaHeaders.forEach((header) => {
            newRow[header] = '';
        });
        let curRow = this.state.rows;
        curRow.splice(idx + 1, 0, newRow);
        this.setState({ rows: curRow });
    };

    changeFieldValue = (idx, key) => (e) => {
        this.state.rows[idx][key] = e.target.value;
        this.setState({ rows: this.state.rows });
    };

    moveFieldRow = (idx, direction) => () => {
        // -1 for moving up, 1 for moving down
        let newIndex = idx + direction;
        [this.state.rows[newIndex], this.state.rows[idx]] = [
            this.state.rows[idx],
            this.state.rows[newIndex],
        ];
        console.log(this.state.rows);
        this.setState({ rows: this.state.rows });
    };

    removeFieldRow = (idx) => () => {
        this.state.rows.splice(idx, 1);
        this.setState({ rows: this.state.rows });
    };

    render() {
        const { classes, editPermission, focused, item } = this.props;
        const { editing, showSchemaDetail, rows } = this.state;
        const schemaItem = item;
        const schemaHeaders = schemaItem.header;
        let headerHtml, bodyRowsHtml;
        headerHtml =
            showSchemaDetail &&
            schemaHeaders.map((item, index) => {
                return (
                    <TableCell
                        component='th'
                        key={index}
                        style={{ padding: '5', fontSize: '16px', maxWidth: '100' }}
                    >
                        {item}
                    </TableCell>
                );
            });
        if (headerHtml) {
            headerHtml.push(
                <TableCell
                    key={headerHtml.length}
                    style={{ padding: '5' }}
                    component='th'
                    scope='row'
                >
                    <IconButton disabled={!editing} onClick={this.addFieldRowAfter(-1)}>
                        <AddCircleIcon />
                    </IconButton>
                    {!editing ? (
                        <IconButton onClick={this.toggleEdit(false, false)}>
                            <EditIcon />
                        </IconButton>
                    ) : (
                        <IconButton onClick={this.toggleEdit(false, true)}>
                            <CheckIcon />
                        </IconButton>
                    )}
                    {editing && (
                        <IconButton onClick={this.toggleEdit(true, false)}>
                            <ClearIcon />
                        </IconButton>
                    )}
                </TableCell>,
            );
        }
        bodyRowsHtml =
            showSchemaDetail &&
            rows.map((rowItem, ind) => {
                let rowCells = schemaHeaders.map((headerKey, col) => {
                    return (
                        <TableCell key={col} style={{ padding: '5' }} component='th' scope='row'>
                            <TextField
                                id='standard-multiline-static'
                                multiline
                                placeholder={'<none>'}
                                value={rowItem[headerKey] || ''}
                                disabled={!editing}
                                onChange={this.changeFieldValue(ind, headerKey)}
                            />
                        </TableCell>
                    );
                });
                rowCells.push(
                    <TableCell
                        key={rowCells.length}
                        style={{ padding: '5' }}
                        component='th'
                        scope='row'
                    >
                        <IconButton disabled={!editing} onClick={this.addFieldRowAfter(ind)}>
                            <AddCircleIcon />
                        </IconButton>
                        <IconButton disabled={!editing} onClick={this.removeFieldRow(ind)}>
                            <DeleteSweepIcon />
                        </IconButton>
                        <IconButton
                            disabled={!editing || ind === 0}
                            onClick={this.moveFieldRow(ind, -1)}
                        >
                            <ArrowDropUpIcon />
                        </IconButton>
                        <IconButton
                            disabled={!editing || ind === rows.length - 1}
                            onClick={this.moveFieldRow(ind, 1)}
                        >
                            <ArrowDropDownIcon />
                        </IconButton>
                    </TableCell>,
                );
                return (
                    <TableBody>
                        <TableRow>{rowCells}</TableRow>
                    </TableBody>
                );
            });
        let showSchemasButton = (
            <IconButton
                onClick={() => this.setState({ showSchemaDetail: !showSchemaDetail })}
                style={{ padding: 2 }}
            >
                {showSchemaDetail ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
        );
        let schemaTable = null;
        if (showSchemaDetail) {
            schemaTable = (
                <Table className={classNames(classes.fullTable)}>
                    <TableHead>
                        <TableRow>{headerHtml}</TableRow>
                    </TableHead>
                    {bodyRowsHtml}
                </Table>
            );
        }
        if (focused) {
            Mousetrap.bind(
                ['enter'],
                (e) => {
                    e.preventDefault();
                    this.setState({ showSchemaDetail: !showSchemaDetail });
                },
                'keydown',
            );
            Mousetrap.bind(
                ['a+e'],
                (e) => {
                    e.preventDefault();
                    this.setState({ editing: !editing });
                },
                'keydown',
            );
        }

        return (
            editPermission && (
                <div
                    onClick={() => {
                        this.props.setFocus(this.props.focusIndex, 0);
                    }}
                >
                    <div className={classNames(classes.item, focused ? classes.highlight : '')}>
                        {showSchemasButton}
                        {'Schema: ' + schemaItem.schema_name}
                    </div>
                    {schemaTable}
                </div>
            )
        );
    }
}

const styles = (theme) => ({
    item: {
        borderTop: '2px solid #ddd',
    },
    fullTable: {
        borderTop: '2px solid #ddd',
    },
    highlight: {
        backgroundColor: `${theme.color.primary.lightest} !important`,
    },
});

export default withStyles(styles)(SchemaItem);