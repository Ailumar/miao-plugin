import { Common, Cfg } from '../components/index.js'
import { renderAvatar } from './character/avatar-card.js'
import { getTargetUid, getProfile, profileHelp, getProfileAll } from './character/profile-common.js'
import { profileArtis } from './character/profile-artis.js'
import { renderProfile } from './character/profile-detail.js'
import { Character } from '../components/models.js'
import { isV3 } from '../components/Changelog.js'

export { enemyLv, getOriginalPicture } from './character/utils.js'

// 角色图像上传
export { uploadCharacterImg } from './character/character-img-upload.js'

//
export { getProfileAll, getProfile, profileHelp }

// 圣遗物列表
export { profileArtisList } from './character/profile-artis.js'

// 老婆
export { wife, pokeWife, wifeReg } from './character/avatar-wife.js'

// 查看当前角色
export async function character (e, { render }) {
  let msg = e.original_msg || e.msg
  if (!msg) {
    return
  }

  let mode = 'card'
  let uidRet = /[0-9]{9}/.exec(msg)
  if (uidRet) {
    e.uid = uidRet[0]
    msg = msg.replace(uidRet[0], '')
  }
  let name = msg.replace(/#|老婆|老公/g, '').trim()
  msg = msg.replace('面版', '面板')
  let dmgRet = /伤害(\d?)$/.exec(name);
  let dmgIdx = 0
  if (/(详情|详细|面板|面版)\s*$/.test(msg) && !/更新|录入|输入/.test(msg)) {
    mode = 'profile'
    name = name.replace(/(详情|详细|面板)/, '').trim()
  } else if (dmgRet) {
    mode = 'dmg'
    name = name.replace(/伤害[0-5]?/, '').trim()
    if (dmgRet[1]) {
      dmgIdx = dmgRet[1] * 1
    }
  } else if (/(详情|详细|面板)更新$/.test(msg) || (/更新/.test(msg) && /(详情|详细|面板)$/.test(msg))) {
    mode = 'refresh'
    name = name.replace(/详情|详细|面板|更新/g, '').trim()
  } else if (/(录入|输入)/.test(msg) && /(详情|详细|面板)/.test(msg)) {
    mode = 'input'
    let nameRet = /(?:录入|输入)(.+)(?:面板|详细|详情|数据)+/.exec(name)
    if (nameRet) {
      name = nameRet[1]
      e.inputData = msg.replace(nameRet[0], '')
    }
    name = name.replace(/录入|输入|详情|详细|面板|数据|[0-9]|\.|\+/g, '').trim()
  } else if (/圣遗物/.test(msg)) {
    mode = 'artis'
    name = name.replace('圣遗物', '').trim()
  }

  if (mode === 'card' && Common.isDisable(e, 'char.char')) {
    return
  }

  if (mode !== 'card' && !e.isMaster) {
    if (Common.isDisable(e, 'char.profile')) {
      // 面板开关关闭
      return
    }
    if (e.isPrivate) {
      if ((e.sub_type === 'friend' && Cfg.get('profile.friend.status') === false) ||
          (e.sub_type === 'group' && Cfg.get('profile.stranger.status') === false)) {
        return
      }
    } else if (e.isGroup) {
      let groupCfg = Cfg.get(`profile.groups.群${e.group_id}.status`)
      if (groupCfg === false || (groupCfg !== true && Cfg.get('profile.group.status') === false)) {
        return
      }
    }
  }

  let char = Character.get(name.trim())

  if (!char) {
    return false
  }

  if (mode === 'card') {
    return renderAvatar(e, char.name, render)
  }

  let uid = await getTargetUid(e)
  if (!uid) {
    return true
  }
  e.uid = uid
  e.avatar = char.id

  if (char.isCustom) {
    e.reply('自定义角色暂不支持此功能')
    return true
  }

  if (mode === 'profile' || mode === 'dmg') {
    return renderProfile(e, char, render, mode, { dmgIdx })
  } else if (mode === 'refresh' || mode === 'input') {
    await getProfile(e, mode)
    return true
  } else if (mode === 'artis') {
    return profileArtis(e, { render })
  }
  return true
}
