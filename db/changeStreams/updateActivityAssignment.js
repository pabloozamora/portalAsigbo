import { updateServiceHours } from '../../apiServices/user/user.model.js';
import ActivityAssignmentSchema from '../schemas/activityAssignment.schema.js';

const startUpdateActivityAssignmentChangeStream = () => {
  const changeStream = ActivityAssignmentSchema.watch([], { fullDocumentBeforeChange: 'required' });

  changeStream.on('change', async (change) => {
    if (change.operationType === 'update') {
      const {
        updateDescription: { updatedFields },
      } = change;
      const updatedKeys = Object.keys(updatedFields);
      if (!updatedKeys.includes('activity.serviceHours') && !updatedKeys.includes('completed')) {
        return;
      }

      const {
        fullDocumentBeforeChange: {
          activity: {
            serviceHours: previousServiceHours,
            asigboArea: { _id: asigboAreaId },
          },
          user: { _id: userId },
          completed,
        },
      } = change;

      if (updatedKeys.includes('activity.serviceHours') && updatedKeys.includes('completed')) {
        // actualizando estado de completado y cantidad de horas
        let hoursToAdd = 0;
        let hoursToRemove = 0;
        const newServiceHours = updatedFields['activity.serviceHours'];

        if (updatedFields.completed) {
        // añadir horas al total
          hoursToAdd = newServiceHours;
        } else {
          hoursToRemove = previousServiceHours;
        }
        try {
          updateServiceHours({
            userId, asigboAreaId, hoursToRemove, hoursToAdd,
          });
        } catch (ex) {
        // content
        }
      } else if (updatedKeys.includes('activity.serviceHours')) {
      // actualizando solo cantidad de horas

        if (!completed) return;

        // cantidad de horas actualizadas
        const newServiceHours = updatedFields['activity.serviceHours'];

        // actualizar horas de servicio
        try {
          updateServiceHours({
            userId, asigboAreaId, hoursToRemove: previousServiceHours, hoursToAdd: newServiceHours,
          });
        } catch (ex) {
        // content
        }
      } else if (updatedKeys.includes('completed')) {
      // manejo solo de cambio de estado de completado

        let hoursToAdd = 0;
        let hoursToRemove = 0;
        if (updatedFields.completed) {
        // añadir horas al total
          hoursToAdd = previousServiceHours;
        } else {
          hoursToRemove = previousServiceHours;
        }
        try {
          updateServiceHours({
            userId, asigboAreaId, hoursToRemove, hoursToAdd,
          });
        } catch (ex) {
        // content
        }
      }
    }
  });
};
export default startUpdateActivityAssignmentChangeStream;
