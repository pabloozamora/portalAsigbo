# Portal Asigbo

## Rutas

### Sesión

* **/session/login**

  Método: Post

  Permite que un usuario inicie sesión.

  Parámetros requeridos:
  - user: email o código del becado.
  - password: contraseña.

* **/session/accessToken**

  Método: Get

  Retorna el acessToken refrescado.

* **/session/logout**

  Método: Post

  Permite cerrar la sesión del usuario.



### Actividades

* **/activity/**

  Método: Get

  Permite obtener el listado de actividades.

  Query Params (?params):
  - asigboArea: id del eje de asigbo al que pertenece la actividad.
  - limitDate: fecha máxima. Se mostrarán las actividades menores o iguales a este valor.
  - query: Búsqueda de strings en el nombre de la actividad.

* **/activity/**

  Método: Post

  Permite crear una nueva actividad relacionada a algún eje de asigbo.

  Parámetros requeridos:
  - name: nombre de la actividad.
  - date: fecha en que se realizará la actividad.
  - serviceHours: horas de servicio que se darán al completar la actividad.
  - responsible: (array) lista con los id's de los usuarios encargados de la actividad.
  - idAsigboArea: id del eje de asigbo correspondiente.
  - registrationStartDate: fecha en que la actividad se muestra disponible a los becados para su inscripción.
  - registrationEndDate: fecha límite de inscripción.
  - participantsNumber: número máximo de participantes.

  Parámetros opcionales:
  - paymentAmount: monto del pago requerido para la actividad.
  - participatingPromotions: lista con el año de las promociones de becados que se pueden inscribir. Un valor **null** implíca que todos los becados pueden inscribirse.

* **/activity/**

  Método: Patch

  Permite actualizar los campos de una actividad. Si un campo no es proveído, su valor se mantendrá sin modificaciones.

  Parámetros requeridos:
  - id: id de la actividad a modificar:

  Parámetros opcionales:
  - name: nombre de la actividad.
  - date: fecha en que se realizará la actividad.
  - serviceHours: horas de servicio que se darán al completar la actividad.
  - responsible: (array) lista con los id's de los usuarios encargados de la actividad.
  - idAsigboArea: id del eje de asigbo correspondiente.
  - registrationStartDate: fecha en que la actividad se muestra disponible a los becados para su inscripción.
  - registrationEndDate: fecha límite de inscripción.
  - participantsNumber: número máximo de participantes.
  - paymentAmount: monto del pago requerido para la actividad.
  - participatingPromotions: lista con el año de las promociones de becados que se pueden inscribir. Un valor **null** implíca que todos los becados pueden inscribirse.


* **/activity/:activityId**

  Método: delete

  Permite eliminar una actividad, siempre y cuando no hayan personas inscritas en la misma.

### Asignaciones en actividades

* **/activity/assignment/**

  Método: Post

  Permite asignar a un usuario a una actividad existente.

  Parámetros requeridos:
  - idUser: id del usuario a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.
  
  Parámetros opcionales:
  - completed: indíca si el becado ya completo la actividad en la que se va a inscribir. (Valor por defecto false)

* **/activity/assignment/assignMany**

  Método: Post

  Permite asignar a una lista de usuarios a una actividad existente.

  Parámetros requeridos:
  - idUsersList: (array) lista de los id's de usuarios a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.
  
  Parámetros opcionales:
  - completed: indíca si los becados ya completaron la actividad en la que se va a inscribir. (Valor por defecto false)

* **/activity/assignment/user/:idUser**

  Método: Get

  Permite obtener las actividades en las que está inscrito un usuario.

* **/activity/assignment/logged**

  Método: Get

  Permite obtener las actividades en las que está inscrito el usuario en sesión.

* **/activity/assignment/complete**

  Método: Patch

  Permite actualizar el status de la asignación de un usuario a una actividad, como completado.

  Parámetros obligatorios:
  - idActivity: id de la actividad en cuestión.
  - idUser: id del usuario en cuestión.

* **/activity/assignment/uncomplete**

  Método: Patch

  Permite actualizar el status de la asignación de un usuario a una actividad, como NO completado.

  Parámetros obligatorios:
  - idActivity: id de la actividad en cuestión.
  - idUser: id del usuario en cuestión.

* **/activity/assignment/**

  Método: Delete

  Permite eliminar la inscripción de un usuario a una actividad.

  Parámetros obligatorios:
  - idActivity: id de la actividad en cuestión.
  - idUser: id del usuario en cuestión.

## Notas

### Consideraciones para la bd

Para correr los "changeStreams" es necesario ejecutar los siguientes comandos en la consola 
de MongoDB Atlas.

```
db.runCommand({collMod: "activityassignments", changeStreamPreAndPostImages: {enabled: true}})

```