# monday-punchlist
An app designed to work with [monday](https://monday.com) project management software. Order tasks from multiple boards & groups in one place.

## Inspiration
After not being able to order tasks across multiple groups & boards, I made this app using monday's developer platform (which is currently in beta).

## Experience with Monday
I've got to hand it to monday, they've done a great job on their API. I worked with it when it was REST based in v1, and v2 is even better with the move to GraphQL. On top of that their app platform takes the headache out of OAuth and essentially allows you to create an app/widget in any frontend JS framework. Any backend requirements can either met with existing GraphQL queries or with a lightweight key/value store. 

One of my favorite things about the experience was their delightful documentation on both the app & API side. Not once did I have to dig for answers.

## Installation
You'll want to reference the official [documentation](https://monday.com/developers/apps/manage). A zip of the build folder is available in the releases of this repo.

## Usage
This can be added as a dashboard widget. Boards & users can be filtered. Tasks can be reordered with drag and drop.

## Limitations
 - Currently the app is limited to a board with a status column with the following values: Backlog, Hot Fix, Doing, Done, Roadblocked, In Process, On Hold, and To Do. These values can be adjusted on line `222` of `App.js`. Eventually the app will dynamically adjust based off the acceptable values of the status column.
 - The app uses the first column it finds with the id of `status`. I'd like to adjust it so the user can select the status column when they set up the app.
 - The order system needs some work. There's a reset button to clear the order that is stored, but it might not handle adding new tasks to the board very well.
