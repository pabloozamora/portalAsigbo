# Portal Asigbo

## Rutas

### Sesión

- **/session/login**

  Método: Post
  Acceso: libre

  Permite que un usuario inicie sesión.

  Parámetros requeridos:

  - user: email o código del becado.
  - password: contraseña.

- **/session/accessToken**

  Método: Get
  Acceso: todos los usuarios loggeados.

  Retorna el acessToken refrescado.

- **/session/logout**

  Método: Post
  Acceso: todos los usuarios loggeados.

  Permite cerrar la sesión del usuario.

### Actividades

- **/activity/**

  Método: Get
  Acceso: Admin, AreaResponsible y activityResponsible.

  Permite obtener el listado de actividades.
  Si el usuario es admin, devuelve el listado completo. Si es encargado de área, devuelve solo
  aquellas actividades pertenecientes al área donde es encargado. Si es encargado de actividad,
  devuelve solo las actividades de las que es encargado.

  Query Params (?params):

  - asigboArea: id del eje de asigbo al que pertenece la actividad.
  - page: indica la página a consultar. Empieza en cero la numeración. Si es null, devuelve el listado completo.
  - lowerDate: limite inferior inclusivo para la fecha de la actividad.
  - upperDate: limite superior inlusivo para la fecha de la actividad.
  - search: cadena a buscar dentro del nombre de la actividad.

- **/acitivy/:idActivity**

  Método: Get
  Acceso: Todos los usuarios loggeados.

  Permite obtener la información de una actividad a través de su id.

  Si el usuario en sesión está inscrito en la actividad, incluye el parámetro **userAssignment**
  con la información de la asignación.

- **/activity/**

  Método: Post
  Acceso: Admin y encargado del área.

  Permite crear una nueva actividad relacionada a algún eje de asigbo. 
  Solo el administrador y los encargados de el área respectiva pueden crear una actividad.

  Parámetros requeridos (formData):

  - name: nombre de la actividad.
  - date: fecha en que se realizará la actividad.
  - description: descripción de la actividad.
  - serviceHours: horas de servicio que se darán al completar la actividad.
  - responsible: (array) lista con los id's de los usuarios encargados de la actividad.
  - idAsigboArea: id del eje de asigbo correspondiente.
  - registrationStartDate: fecha en que la actividad se muestra disponible a los becados para su inscripción.
  - registrationEndDate: fecha límite de inscripción.
  - participantsNumber: número máximo de participantes.

  Parámetros opcionales (formData):

  - paymentAmount: monto del pago requerido para la actividad.
  - participatingPromotions: lista con el año de las promociones de becados que se pueden inscribir. También se puede incluir el nombre del grupo de promociones (chick, student y graduate). Un valor **null** implíca que todos los becados pueden inscribirse.
  - banner: objeto file con imagenes .png, jpg o gif a colocar como banner.

- **/activity/**

  Método: Patch
  Acceso: Admin y encargado del área.

  Permite actualizar los campos de una actividad. Si un campo no es proveído, su valor se mantendrá sin modificaciones.
  Solo el administrador y los encargados de el área respectiva pueden crear una actividad.

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
  - banner: objeto file con imagenes .png, jpg o gif a colocar como banner. Si ya existía un 
  banner previo, el banner es reemplazado.
  - removeBanner: valor booleano que indica si se debe de eliminar el banner para la actividad. Si se
  agregó un archivo en la propiedad banner, este valor es ignorado.

  Nota: El eje de asigbo al que pertenece la actividad no puede ser modificado.

- **/activity/:activityId**

  Método: delete
  Acceso: Admin y encargado del área.

  Permite eliminar una actividad, siempre y cuando no hayan personas inscritas en la misma.

- **/activity/logged**

  Método: Get
  Acceso: Todos los usuario loggeados.

  Devuelve el listado de actividades en las que ha participado el usuario actualmente loggeado.

- **/activity/responsible/:idUser**

  Método: Get
  Acceso: Todos los usuarios loggeados.

  Devuelve el listado de actividades en las que el usuario figura como responsable.
  Cada usuario puede acceder a su propia información. El acceso a terceros es exclusivo del admin.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario que se desea conocer sus actividades.

  Parametros de búsqueda (?params):
  
  - page: indica la página a consultar. Empieza en cero la numeración. Si es null, devuelve el listado completo.
  - lowerDate: limite inferior inclusivo para la fecha de la actividad.
  - upperDate: limite superior inlusivo para la fecha de la actividad.
  - search: cadena a buscar dentro del nombre de la actividad.


  **/activity/:idActivity/enable**

  Método: Patch
  Acceso: Admin y encargado del área.

  Parámetro obligatorio en la ruta:

  - idActivity: id de la actividad a habilitar.

  **/activity/:idActivity/disable**

  Método: Patch
  Acceso: Admin y encargado del área.

  Parámetro obligatorio en la ruta:

  - idActivity: id de la actividad a deshabilitar.


### Asignaciones en actividades

- **/activity/assignment/**

  Método: Get
  Acceso: Todos los usuarios loggeados.

  Permite obtener la lista de asignaciones para cualquier actividad.
  Si el usuario no es admin, devuelve únicamente los resultados del usuario en sesión.

  Parámetros de búsqueda opcionales (?params):

  - idUser: filtrar por usuario.
  - idActivity: filtrar por actividad
  - page: indica la página a consultar. Empieza en cero la numeración. Si es null, devuelve el listado completo.
  - lowerDate: limite inferior inclusivo para la fecha de la actividad.
  - upperDate: limite superior inlusivo para la fecha de la actividad.
  - search: cadena a buscar dentro del nombre de la actividad.

- **/activity/:idActivity/assignment/:idUser**

  Método: Post
  Acceso: admin, encargado del área y encargado de la actividad.

  Permite asignar a un usuario a una actividad existente.

  Parámetros requeridos en la ruta:

  - idUser: id del usuario a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.

  Parámetros opcionales:

  - completed: indíca si el becado ya completo la actividad en la que se va a inscribir. (Valor por defecto false)

- **/activity/assignMany**

  Método: Post
  Acceso: admin.

  Permite asignar a una lista de usuarios a una actividad existente.

  Parámetros requeridos:

  - idUsersList: (array) lista de los id's de usuarios a inscribir.
  - idActivity: id de la actividad en la que se va a inscribir.

  Parámetros opcionales:

  - completed: indíca si los becados ya completaron la actividad en la que se va a inscribir. (Valor por defecto false)

- **/activity/:idActivity/assignment/**

  Método: Get
  Acceso: Todos los usuarios loggeados.

  Permite obtener la lista de asignaciones de una actividad.

  Parámetros requeridos en la ruta:

  - idActivity: id de la actividad a buscar.

- **/activity/assignment/logged**

  Método: Get
  Acceso: Todos los usuarios loggeados.

  Permite obtener las actividades en las que está inscrito el usuario en sesión.

- **/activity/:idActivity/assignment/:idUser**

  Método: Patch
  Acceso: admin, encargado del área y encargado de la actividad.

  Permite actualizar la asignación de un usuario a una actividad.

  Parámetros obligatorios en la ruta:

  - idActivity: id de la actividad a completar.
  - idUser: id del usuario correspondiente.

  Parámetros opcionales body (campos a editar):

  - completed: boolean. Indica si la actividad ha sido completada.
  - aditionalServiceHours: Number. Horas de servicio adicionales que corresponden únicamente a un usuario asignado en una acividad.

- **/activity/:idActivity/assignment/:idUser**

  Método: Delete
  Acceso: admin, encargado del área y encargado de la actividad.

  Permite eliminar la inscripción de un usuario a una actividad.

  Parámetros obligatorios en la ruta:

  - idActivity: id de la actividad a completar.
  - idUser: id del usuario correspondiente.


### Configuración de promociones

- **/promotion/**

  Método: Get
  Acceso: Todos los usuarios loggeados

  Obtiene el año de las promociones "estudiantes" y el nombre de los grupos de promociones "no estudiantes" (pollitos y graduados).

- **/promotion/currentStudents**

  Método: Post
  Acceso: Admin.

  Almacena la promoción de primer y último año para conocer a qué promociones pertenecen los becados estudiantes.

  Parámetros obligatorios:

  - firstYearPromotion: año de ingreso de la promoción que se encuentra en primer año.
  - lastYearPromotion: año de ingreso de la promoción que se encuentra en último año.

### Asigbo Area

- **/area**

  Método: Get
  Acceso: Admin y encargado de área.

  Obtiene el listado de áreas activas. Si el usuario es admin, devuelve el listado completo de áreas.
  Si es encargado de área, devuelve únicamente las áreas de las que es encargado.

- **/area/:idArea**

  Método: Get
  Acceso: Admin y el encargado del área.

  Obtiene la información de un área en específico.

  Parámetros obligatorios en la ruta:

  - idArea: id del área a consultar.

- **/area**

  Método: Post
  Acceso: Admin.

  Crea una nueva área de ASIGBO con la información especificada.

  Parámetros requeridos:

  - responsible: (array) lista de usuarios que serán responsables de área.
  - name: nombre del área a crear.
  - color: color representativo del eje. El valor debe ser en formato hexadecimal.

- **/area/:idArea**

  Método: Patch
  Acceso: Admin

  Actualiza el nombre del área especificada.

  Parámetro obligatorio en la ruta:

  - idArea: id del área de ASIGBO a modificar.

  Parámetros requeridos:

  - name: nuevo nombre del área.
  - responsible: lista de id's de los usuarios encargados. Se deben agregar todos los responsables. Si la lista no incluye alguno de los encargados anteriores, sus privilegios serán retirados.
  - color: color representativo del eje. El valor debe ser en formato hexadecimal.

- **/area/:idArea/enable**

  Método: Patch
  Acceso: Admin.

  Actualiza el status blocked del área a falso.

  Parámetro obligatorio en la ruta:

  - idArea: id del área de ASIGBO a modificar.

- **/area/:idArea/disable**

  Método: Patch
  Acceso: Admin.

  Actualiza el status blocked del área a verdadero.

  Parámetro obligatorio en la ruta:

  - idArea: id del área de ASIGBO a modificar.

- **/area/:idArea**

  Método: Delete
  Acceso: Admin

  Elimina el área especificada. Un área solo puede eliminarse si esta no posee actividades.

  Parámetro obligatorio en la ruta:

  - idArea: id del área de ASIGBO a eliminar.

### User

- **/user**

  Método: Get
  Acceso: Admin y encargados de área, actividad y promoción.

  Obtiene el listado de usuarios. Por defecto devuelve únicamente a los usuarios activos.
  El usuario admin tiene acceso a los datos sensibles de todos los usuarios. 

  Parámetros de búsqueda opcionales (?params):

  - promotion: año de promoción de estudiantes a mostrar. También permite el nombre del grupo de becados.
  - search: cadena de texto a encontrar en el nombre y apellido de los becados.
  - priority (puede ser un arreglo): id de los usuarios a priorizar y mostrar primero.
  - page: página de resultados a mostrar.
  - role: devuelve los usuarios con un rol específico.
  - includeBlocked: incluye en el resultado a los usuarios deshabilitados.

- **/user**

  Método: Post
  Acceso: Admin.

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

- **/user/:idUser**

  Método: Patch
  Acceso: Todos los usuarios loggeados.

  Permite la actualización de los datos del perfil de un usuario.
  El administrador puede editar todos los perfiles.
  Cada usuario puede editar su propio perfil.

  Parámetros requeridos en la ruta:
  - idUser: id del usuario a editar.

  Parámetros opcionales (si no se agrega, el campo no sufre modificaciones):

  - code: código de identificación del usuario.
  - name: nombres del usuario.
  - lastname: apellidos del usuario.
  - email: correo electrónico.
  - promotion: año en el que inició sus estudios universitarios.
  - sex: sexo del usuario (M o F).
  - career: carrera que estudia.
  - removeProfilePicture: boolean que indica si se desea eliminar la foto de perfil.
  - password: modifica la contraseña del usuario. Disponible exclusivamente al editar el usuario en sesión.

- **/user/logged**

  Método: Get
  Access: todos los usuarios loggeados.

  Devuelve la información del usuario actualmente loggeado.

- **/user/:idUser**

  Método: Get
  Acceso: todos los usuarios loggeados.

  Devuelve la información del usuario requerido. Si el usuario que lo solicita no es admin o el
  suario en cuestión, no devuelve datos sensibles.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

- **/user/admin**

  Método: Get
  Acceso: Admin.

  Devuelve el listado de todos los usuarios administradores.

- **/user/:idUser/role/admin**

  Método: Patch
  Acceso: Admin.

  Asigna privilegios de administrador al usuario.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

- **/user/:idUser/role/admin**

  Método: Delete
  Acceso: Admin.

  Remueve privilegios de administrador al usuario.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

- **/user/:idUser/disable**

  Método: Patch
  Acceso: Admin.

  Deshabilita un usuario existente. Un usuario deshabilitado no puede iniciar acción ni realizar acción alguna.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

- **/user/:idUser/enable**

  Método: Patch
  Acceso: Admin.

  Habilita un usuario existente.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

  * **/user/:idUser**

  Método: Delete
  Acceso: Admin.

  Eliminar un usuario. El usuario no podrá ser eliminado si es un encargado de área o actividad, ha
  sido asignado a una actividad o ha emitido algún pago.

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

  * **/user/renewRegisterToken**

  Método: Post
  Acceso: Admin.

  Genera un nuevo token de registro para un usuario y lo envía nuevamente a su correo, en caso de que el token original no haya sido enviado correctamente y que el usuario en cuestión aún no haya sido activado (no se le ha asignado una contraseña).

  Parámetro obligatorio en la ruta:

  - idUser: id del usuario.

  * **/user/finishRegistration**

  Método: Post
  Acceso: token de registro requerido.

  Permite finalizar el registro de un usuario en específico. El token requerido para autenticar, es el enviado al email de cada usuario.

  Parámetros obligatorios (body):
  - password: contraseña de la cuenta.

  Parámetro opcional:
  - photo: archivo png, jpg, gif o svg.

  * **/user/updatePassword**

  Método: Post
  Acceso: token para modificar contraseña.

  Permite modificar la contraseña de un usuario a partir de un token de recuperación.

  Parámetros obligatorios (body):
  - password: contraseña de la cuenta.

  * **/user/promotionResponsible**

  Método Get
  Acceso: Admin.

  Obtiene el listado de usuarios que poseen el rol de encargado de promoción.

  * **/user/:idUser/role/promotionResponsible**

  Método Patch
  Acceso: Admin.

  Permite asignar el rol de encargado de promoción a un usuario. 

  Parámetros obligatorios en la ruta:

  - idUser: id del usuario.

  * **/user/:idUser/role/promotionResponsible**

  Método Delete
  Acceso: Admin.

  Retira el rol de encargado de promoción de un usuario.

  Parámetros obligatorios en la ruta:

  - idUser: id del usuario.

  * **/user/validateRegisterToken**

  Método: get
  Acceso: token de registro requerido.

  Permite verificar si un token de registro es válido.

  * **/user/validateRecoverToken**

  Método: get
  Acceso: token de recuperación requerido.

  Permite verificar si un token de recuperación de contraseña es válido.

  * **/user/recoverPassword**

  Método: post
  Acceso: todos los usuarios. Auth no requerida.

  Permite solicitar el envío del correo de recuperación de la cuenta.

  Parámetros obligatorios:

  - email: email del usuario.
  
  * **/user/uploadUsers**

  Método: post
  Acceso: Admin

  Permite agregar masivamente usuarios a la base de datos.

  Parámetros obligatorios:

  - data: arreglo con la información a importar. Este debe ser un arreglo de objetos con los siguientes atributos y tipos de dato:
    - code: number
    - name: string
    - lastname: string
    - university: string
    - campus: string
    - email: string
    - career: string
    - promotion: number
    - sex: string

  La forma en la que llegue la información (archivo csv, txt, etcétera) quedará a discresión del frontend, siempre y cuando cumpla con los atributos y tipos de dato anteriores.


## Notas

### Consideraciones para la bd

Para correr los "changeStreams" es necesario ejecutar los siguientes comandos en la consola
de MongoDB Atlas.

```
db.runCommand({collMod: "activityassignments", changeStreamPreAndPostImages: {enabled: true}})

```
