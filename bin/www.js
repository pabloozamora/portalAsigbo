import app from '../app.js';
import { port } from '../config/default.js';

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}.`);
});
