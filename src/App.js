import React from "react";
import "./App.css";
import mondaySdk from "monday-sdk-js";
import { ReactSortable } from "react-sortablejs";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import Grid from "@material-ui/core/Grid";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Button from "@material-ui/core/Button";
import Container from "@material-ui/core/Container";

const monday = mondaySdk();

class App extends React.Component {
	constructor(props) {
		super(props);

		// Default state
		this.state = {
			list: [],
		};
	}

	filter = async () => {
		if (this.state.boardIDs) {
			const data = await monday.api(`{
  boards (ids: [${this.state.boardIDs}]) {
    id
    name
    items (limit: 5000) {
      id
      name
    column_values {
      id
        text
        value
    }
    }
  }
}`);
			let list = [];
			for (const board of data.data.boards) {
				for (const item of board.items) {
					for (const columnValue of item.column_values) {
						if (
							!this.state.filterUser ||
							this.state.filterUser.teammates.length === 0
						) {
							list.push({ ...item, boardID: board.id, boardName: board.name });
							break;
						}
						if (columnValue.id === "person") {
							const value = JSON.parse(columnValue.value).id;
							if (this.state.filterUser.teammates.includes(`${value}`)) {
								list.push({
									...item,
									boardID: board.id,
									boardName: board.name,
								});
								break;
							}
						}
					}
				}
			}

			const storage = await monday.storage.instance.getItem("order");
			if (storage && storage.data.value) {
				const order = storage.data.value.split(",");

				list = order.map((orderID) => {
					return list.find((listItem) => {
						return listItem.id === orderID;
					});
				});
			}

			this.setState({ list });
		}
	};

	async componentDidMount() {
		// TODO: set up event listeners
		monday.listen("settings", (res) => {
			this.setState({ filterUser: res.data.users }, () => {
				this.filter();
			});
		});

		monday.listen("context", async (res) => {
			if (res.data.boardIds) {
				this.setState({ boardIDs: res.data.boardIds }, () => {
					this.filter();
				});

				if (res.data.boardIds && res.data.boardIds.length > 0) {
					const data = await monday.api(`{
            boards (ids: [${res.data.boardIds[0]}]) {
              columns {
                id
                title
                settings_str
              }
            }
          }`);

					const statusCol = data.data.boards[0].columns.find((col) => {
						return col.id === "status";
					});

					this.setState({
						statusColSettings: JSON.parse(statusCol.settings_str),
					});
				}
			}
		});
	}

	render() {
		return (
			<Container className="App">
				<div style={{ padding: 10 }}>
					<List>
						<ReactSortable
							list={this.state.list}
							setList={async (newState) => {
								this.setState({ list: newState });
								const toStore = newState.map((item) => {
									return item.id;
								});
								if (toStore.length > 0) {
									await monday.storage.instance.setItem(
										"order",
										toStore.join(",")
									);
								}
							}}
						>
							{this.state.list.map((item) => {
								return (
									<ListRow
										item={item}
										key={item.id}
										statusColSettings={this.state.statusColSettings}
									/>
								);
							})}
						</ReactSortable>
					</List>
					<div style={{ textAlign: "center" }}>
						<Button
							variant="contained"
							onClick={async (e) => {
								try {
									await monday.storage.instance.deleteItem("order");
								} catch (e) {
									console.log(e);
								}
							}}
						>
							Clear Order
						</Button>
					</div>
				</div>
			</Container>
		);
	}
}

class ListRow extends React.Component {
	state = {
		status: this.props.item.column_values.find((col) => {
			return col.id === "status";
		}),
	};

	render() {
		return (
			<div style={{ marginTop: 5, marginBottom: 5, padding: 5 }}>
				<Grid container spacing={2}>
					<ListItem button>
						<Grid item xs={9}>
							<ListItemText>{this.props.item.name}</ListItemText>
						</Grid>
						<Grid item xs={3}>
							<Select
								style={{ width: "100%" }}
								value={this.state.status ? this.state.status.text : "(empty)"}
								onChange={(evt) => {
									this.setState({ status: { text: evt.target.value } });

									let index;

									for (const [key, value] of Object.entries(
										this.props.statusColSettings.labels
									)) {
										if (value === evt.target.value) {
											index = key;
										}
									}

									monday
										.api(
											`mutation { change_column_value (item_id: ${
												this.props.item.id
											}, board_id: ${
												this.props.item.boardID
											}, column_id: "status", value: "${JSON.stringify({
												index: parseInt(index),
											}).replace(/"/g, '\\"')}"){id}}`
										)
										.catch((e) => {
											console.log(e);
										});
								}}
							>
								{[
									"Backlog",
									"Hot Fix",
									"Doing",
									"Done",
									"Roadblocked",
									"In Process",
									"On Hold",
									"To Do",
									"(empty)",
								].map((item, index) => {
									return (
										<MenuItem value={item} key={index}>
											{item}
										</MenuItem>
									);
								})}
							</Select>
						</Grid>
					</ListItem>
				</Grid>
			</div>
		);
	}
}

export default App;
