export default (multerInstance) => (req, res, next) => {
  multerInstance(req, res, (err) => {
    if (!err) next();
    else {
      let error = err?.message ?? 'Ocurrió un error al subir imagen.';

      if (err?.code === 'LIMIT_FILE_SIZE') error = 'El tamaño del archivo es demasiado grande. El tamaño máximo es de 1 MB.';

      res.statusMessage = error;
      res.sendStatus(err?.status ?? 500);
    }
  });
};
