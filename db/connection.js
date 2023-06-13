import mongoose from 'mongoose';
import config from 'config';

const uri = config.get('dbConnectionUri');
const connect = () => mongoose.connect(uri);

export default connect;
