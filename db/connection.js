/* eslint-disable no-console */
import mongoose from 'mongoose';
import config from 'config';
import startUpdateActivityAssignmentChangeStream from './changeStreams/updateActivityAssignment.js';

const uri = config.get('dbConnectionUri');
const connect = () => mongoose.connect(uri);

const { connection } = mongoose;

connection.on('error', () => console.error.bind(console, 'connection error'));

connection.once('open', () => {
  startUpdateActivityAssignmentChangeStream();
  console.info('Conexión a la bd exitosa.');
});

export default connect;
export { connection };
