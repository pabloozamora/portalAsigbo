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
  },
  promotionsGroups: {
    chick: 'chick',
    student: 'student',
    graduate: 'graduate',
  },
  bucketRoutes: {
    user: 'user',
    area: 'area',
  },
  resultsNumberPerPage: 7,
  imagePath: {
  },
};

consts.imagePath.user = `${consts.apiPath}/user`;
consts.imagePath.area = `${consts.apiPath}/area`;

export default consts;
