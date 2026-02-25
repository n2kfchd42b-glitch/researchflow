from datetime import datetime
import uuid
from typing import Dict, Any, List, Optional

workspaces: dict = {}
invitations: dict = {}

ROLES = ['pi', 'analyst', 'student', 'reviewer']

def create_workspace(
    name: str,
    description: str,
    owner_email: str,
    owner_name: str,
) -> Dict[str, Any]:
    workspace_id = str(uuid.uuid4())[:8]
    workspace = {
        'id':          workspace_id,
        'name':        name,
        'description': description,
        'created_at':  datetime.utcnow().isoformat(),
        'owner_email': owner_email,
        'members': [
            {
                'email': owner_email,
                'name':  owner_name,
                'role':  'pi',
                'joined_at': datetime.utcnow().isoformat(),
                'status': 'active',
            }
        ],
        'studies':   [],
        'comments':  [],
        'activity':  [
            {
                'id':        str(uuid.uuid4())[:8],
                'user':      owner_name,
                'action':    'Created workspace',
                'detail':    name,
                'timestamp': datetime.utcnow().isoformat(),
            }
        ],
    }
    workspaces[workspace_id] = workspace
    return workspace

def invite_member(
    workspace_id: str,
    invitee_email: str,
    invitee_name: str,
    role: str,
    inviter_email: str,
) -> Dict[str, Any]:
    if workspace_id not in workspaces:
        raise ValueError('Workspace not found')
    workspace = workspaces[workspace_id]
    existing = [m for m in workspace['members'] if m['email'] == invitee_email]
    if existing:
        raise ValueError('Member already in workspace')
    invite_id = str(uuid.uuid4())[:8]
    invitation = {
        'id':            invite_id,
        'workspace_id':  workspace_id,
        'workspace_name': workspace['name'],
        'invitee_email': invitee_email,
        'invitee_name':  invitee_name,
        'role':          role,
        'inviter_email': inviter_email,
        'created_at':    datetime.utcnow().isoformat(),
        'status':        'pending',
    }
    invitations[invite_id] = invitation
    workspace['members'].append({
        'email':     invitee_email,
        'name':      invitee_name,
        'role':      role,
        'joined_at': datetime.utcnow().isoformat(),
        'status':    'pending',
    })
    _log_activity(workspace_id, inviter_email, 'Invited member', f'{invitee_name} as {role}')
    return invitation

def accept_invitation(invite_id: str) -> Dict[str, Any]:
    if invite_id not in invitations:
        raise ValueError('Invitation not found')
    inv = invitations[invite_id]
    inv['status'] = 'accepted'
    workspace = workspaces.get(inv['workspace_id'])
    if workspace:
        for m in workspace['members']:
            if m['email'] == inv['invitee_email']:
                m['status'] = 'active'
                break
        _log_activity(inv['workspace_id'], inv['invitee_email'], 'Joined workspace', inv['workspace_name'])
    return inv

def add_comment(
    workspace_id: str,
    study_id: str,
    user_email: str,
    user_name: str,
    comment: str,
) -> Dict[str, Any]:
    if workspace_id not in workspaces:
        raise ValueError('Workspace not found')
    workspace = workspaces[workspace_id]
    comment_obj = {
        'id':           str(uuid.uuid4())[:8],
        'study_id':     study_id,
        'user_email':   user_email,
        'user_name':    user_name,
        'comment':      comment,
        'created_at':   datetime.utcnow().isoformat(),
        'resolved':     False,
    }
    workspace['comments'].append(comment_obj)
    _log_activity(workspace_id, user_name, 'Added comment', comment[:50])
    return comment_obj

def get_workspace(workspace_id: str) -> Dict[str, Any]:
    if workspace_id not in workspaces:
        raise ValueError('Workspace not found')
    return workspaces[workspace_id]

def get_user_workspaces(user_email: str) -> List[Dict[str, Any]]:
    result = []
    for ws in workspaces.values():
        members = [m['email'] for m in ws['members']]
        if user_email in members:
            result.append(ws)
    return result

def _log_activity(workspace_id: str, user: str, action: str, detail: str):
    if workspace_id not in workspaces:
        return
    workspaces[workspace_id]['activity'].insert(0, {
        'id':        str(uuid.uuid4())[:8],
        'user':      user,
        'action':    action,
        'detail':    detail,
        'timestamp': datetime.utcnow().isoformat(),
    })

def assign_study_to_workspace(workspace_id: str, study_id: str, study_title: str, user_email: str):
    if workspace_id not in workspaces:
        raise ValueError('Workspace not found')
    workspace = workspaces[workspace_id]
    workspace['studies'].append({
        'id':         study_id,
        'title':      study_title,
        'added_by':   user_email,
        'added_at':   datetime.utcnow().isoformat(),
        'status':     'in_progress',
    })
    _log_activity(workspace_id, user_email, 'Added study', study_title)

def update_study_status(workspace_id: str, study_id: str, status: str, user_email: str):
    if workspace_id not in workspaces:
        raise ValueError('Workspace not found')
    workspace = workspaces[workspace_id]
    for s in workspace['studies']:
        if s['id'] == study_id:
            s['status'] = status
            break
    _log_activity(workspace_id, user_email, f'Study marked {status}', study_id)
