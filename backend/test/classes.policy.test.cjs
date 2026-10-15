const test = require('node:test');
const assert = require('node:assert/strict');
const { classroomPermissions, classroomProjectWhere } = require('../dist/modules/classes/classes.policy');

test('classroom permission matrix', () => {
  const cases = [
    [{ isTeacher: true }, [true, true, true, true, false, true]],
    [{ isTeacher: false, classRole: 'CLASS_ADMIN' }, [true, true, true, true, false, false]],
    [{ isTeacher: false, classRole: 'STUDENT', isLeader: true, isGroupMember: true }, [false, true, true, true, true, false]],
    [{ isTeacher: false, classRole: 'STUDENT', isGroupMember: true }, [false, false, false, true, true, false]],
    [{ isTeacher: false }, [false, false, false, false, false, false]]
  ];

  for (const [context, expected] of cases) {
    const rights = classroomPermissions(context);
    assert.deepEqual(
      [rights.manageClass, rights.manageGroup, rights.manageProject, rights.viewGroupProject, rights.submitReport, rights.reviewReport],
      expected,
      JSON.stringify(context)
    );
  }
});

test('class overview limits students to their own group projects', () => {
  const student = classroomProjectWhere('class-id', 'student-id', false);
  const manager = classroomProjectWhere('class-id', 'teacher-id', true);
  assert.deepEqual(student.studyGroup, { members: { some: { userId: 'student-id' } } });
  assert.equal(manager.studyGroup, undefined);
  assert.equal(student.classId, 'class-id');
  assert.equal(student.deletedAt, null);
});
