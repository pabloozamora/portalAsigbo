# Portal Asigbo

### Consideraciones para la bd

Para correr los "changeStreams" es necesario ejecutar los siguientes comandos en la consola 
de MongoDB Atlas.

```
db.runCommand({collMod: "activityassignments", changeStreamPreAndPostImages: {enabled: true}})

```