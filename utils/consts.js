const consts = {
  apiPath: '/api',
  roles: {
    admin: 'admin',
    scolarshipHolder: 'scolarshipHolder',
    promotionResponsible: 'promotionResponsible',
    asigboAreaResponsible: 'asigboAreaResponsible',
    activityResponsible: 'activityResponsible',
  },
  token: {
    refresh: 'REFRESH',
    access: 'ACCESS',
    register: 'REGISTER',
    recover: 'RECOVER',
  },
  promotionsGroups: {
    chick: 'chick',
    student: 'student',
    graduate: 'graduate',
  },
  bucketRoutes: {
    user: 'user',
    area: 'area',
    activity: 'activity',
  },
  resultsNumberPerPage: 7,
  imagePath: {
  },
};

consts.imagePath.user = `${consts.apiPath}/user`;
consts.imagePath.area = `${consts.apiPath}/area`;
consts.imagePath.activity = `${consts.apiPath}/activity`;

export default consts;
