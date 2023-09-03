export default (multerInstance) => (req, res, next) => {
  multerInstance(req, res, (err) => {
    if (!err) next();
    else {
      res.statusMessage = err?.message ?? 'Ocurrió un error al subir imagen.';
      res.sendStatus(err?.status ?? 500);
    }
  });
};
