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

* **/acitivy/:idActivity**

  Método: Get

  Permite obtener la información de una actividad a través de su id.

  Si el usuario en sesión está inscrito en la actividad, incluye el parámetro **userAssignment**
  con la información de la asignación.
  

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
  - participatingPromotions: lista con el año de las promociones de becados que se pueden inscribir. También se puede incluir el nombre del grupo de promociones (chick, student y graduate). Un valor **null** implíca que todos los becados pueden inscribirse.

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
  - registrationStartDate: fecha en que la actividad se muestra disponible a los becados para su inscripción.
  - registrationEndDate: fecha límite de inscripción.
  - participantsNumber: número máximo de participantes.
  - paymentAmount: monto del pago requerido para la actividad.
  - participatingPromotions: lista con el año de las promociones de becados que se pueden inscribir. También se puede incluir el nombre del grupo de promociones (chick, student y graduate). Un valor **null** implíca que todos los becados pueden inscribirse.

  Nota: El eje de asigbo al que pertenece la actividad no puede ser modificado.


* **/activity/:activityId**

  Método: delete

  Permite eliminar una actividad, siempre y cuando no hayan personas inscritas en la misma.

* **/activity/logged**

  Método: Get

  Devuelve el listado de actividades en las que ha participado el usuario actualmente loggeado.

* **/activity/:idUser**

  Método: Get

  Devuelve el listado de actividades en las que ha participado el usuario especificado.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario que se desea conocer sus actividades.

### Asignaciones en actividades

* **/activity/assignment/**

  Método: Get

  Permite obtener la lista de asignaciones para cualquier actividad.

  Parámetros de búsqueda opcionales (?params):
  - idUser: filtrar por usuario.

* **/activity/:idActivity/assignment/:idUser**

  Método: Post

  Permite asignar a un usuario a una actividad existente.

  Parámetros requeridos en la ruta:
  - idUser: id del usuario a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.
  
  Parámetros opcionales:
  - completed: indíca si el becado ya completo la actividad en la que se va a inscribir. (Valor por defecto false)

* **/activity/assignMany**

  Método: Post

  Permite asignar a una lista de usuarios a una actividad existente.

  Parámetros requeridos:
  - idUsersList: (array) lista de los id's de usuarios a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.
  
  Parámetros opcionales:
  - completed: indíca si los becados ya completaron la actividad en la que se va a inscribir. (Valor por defecto false)

* **/activity/:idActivity/assignment/**

  Método: Get

  Permite obtener la lista de asignaciones de una actividad.

  Parámetros requeridos en la ruta:
  - idActivity: id de la actividad a buscar.


* **/activity/assignment/logged**

  Método: Get

  Permite obtener las actividades en las que está inscrito el usuario en sesión.

* **/activity/:idActivity/assignment/:idUser**

  Método: Patch

  Permite actualizar la asignación de un usuario a una actividad.

  Parámetros obligatorios en la ruta:
  - idActivity: id de la actividad a completar.
  - idUser: id del usuario correspondiente.

  Parámetros opcionales body (campos a editar):
  - completed: boolean. Indica si la actividad ha sido completada.

* **/activity/:idActivity/assignment/:idUser**

  Método: Delete

  Permite eliminar la inscripción de un usuario a una actividad.

   Parámetros obligatorios en la ruta:
  - idActivity: id de la actividad a completar.
  - idUser: id del usuario correspondiente.

### Configuración de promociones

* **/promotion/**

  Método: Get

  Obtiene el año de las promociones "estudiantes" y el nombre de los grupos de promociones "no estudiantes" (pollitos y graduados).

* **/promotion/currentStudents**

  Método: Post

  Almacena la promoción de primer y último año para conocer a qué promociones pertenecen los becados estudiantes.

  Parámetros obligatorios:
  - firstYearPromotion: año de ingreso de la promoción que se encuentra en primer año.
  - lastYearPromotion: año de ingreso de la promoción que se encuentra en último año.
  
### Asigbo Area

* **/area**

  Método: Get

  Obtiene el listado de áreas activas.

* **/area/:idArea**

  Método: Get

  Obtiene el listado de áreas activas.

  Parámetros obligatorios en la ruta:
  - idArea: id del área a consultar.

* **/area**

  Método: Post

  Crea una nueva área de ASIGBO con la información especificada.

  Parámetros requeridos:
  - responsible: (array) lista de usuarios que serán responsables de área.
  - name: nombre del área a crear.

* **/area/:idArea**

  Método: Patch

  Actualiza el nombre del área especificada.

  Parámetro obligatorio en la ruta: 
  - idArea: id del área de ASIGBO a modificar.

  Parámetros requeridos:
  - name: nuevo nombre del área.
  - responsible: lista de id's de los usuarios encargados. Se deben agregar todos los responsables. Si la lista no incluye alguno de los encargados anteriores, sus privilegios serán retirados.

* **/area/:idArea/enable**

  Método: Patch

  Actualiza el status blocked del área a falso.

  Parámetro obligatorio en la ruta: 
  - idArea: id del área de ASIGBO a modificar.

* **/area/:idArea/disable**

  Método: Patch

  Actualiza el status blocked del área a verdadero.

  Parámetro obligatorio en la ruta: 
  - idArea: id del área de ASIGBO a modificar.

* **/area/:idArea**

  Método: Delete

  Modifica el área especificada como inactiva.

  Parámetro obligatorio en la ruta: 
  - idArea: id del área de ASIGBO a desactivar.

### User

* **/user**

  Método: Get

  Obtiene el listado de usuarios. Por defecto devuelve únicamente a los usuarios activos.

  Parámetros de búsqueda opcionales (?params):
  - promotion: año de promoción de estudiantes a mostrar. También permite el nombre del grupo de becados.
  - search: cadena de texto a encontrar en el nombre y apellido de los becados.
  - priority (puede ser un arreglo): id de los usuarios a priorizar y mostrar primero.
  - page: página de resultados a mostrar.
  - role: devuelve los usuarios con un rol específico.
  - includeBlocked: incluye en el resultado a los usuarios deshabilitados.

* **/user**

  Método: Post

  Permite la creación de un nuevo usuario con la información especificada.

  Parámetros requeridos:
  - code: código de identificación del usuario.
  - name: nombres del usuario.
  - lastname: apellidos del usuario.
  - email: correo electrónico.
  - promotion: año en el que inició sus estudios universitarios.
  - password: contraseña para iniciar sesión en el portal.
  - sex: sexo del usuario (M o F).
  - career: carrera que estudia.

* **/user/logged**

  Método: Get

  Devuelve la información del usuario actualmente loggeado.

* **/user/:idUser**

  Método: Get

  Devuelve la información del usuario requerido.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

* **/user/admin**

  Método: Get

  Devuelve el listado de todos los usuarios administradores.

* **/user/:idUser/role/admin**

  Método: Patch

  Asigna privilegios de administrador al usuario.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

* **/user/:idUser/role/admin**

  Método: Delete

  Remueve privilegios de administrador al usuario.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

* **/user/:idUser/disable**

  Método: Patch

  Deshabilita un usuario existente. Un usuario deshabilitado no puede iniciar acción ni realizar acción alguna.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

* **/user/:idUser/enable**

  Método: Patch

  Habilita un usuario existente.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

  * **/user/:idUser**

  Método: Delete

  Eliminar un usuario. El usuario no podrá ser eliminado si es un encargado de área o actividad, ha
  sido asignado a una actividad o ha emitido algún pago.

  Parámetro obligatorio en la ruta: 
  - idUser: id del usuario.

## Notas

### Consideraciones para la bd

Para correr los "changeStreams" es necesario ejecutar los siguientes comandos en la consola 
de MongoDB Atlas.

```
db.runCommand({collMod: "activityassignments", changeStreamPreAndPostImages: {enabled: true}})

```