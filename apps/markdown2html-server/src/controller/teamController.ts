import express, { Response, Request } from "express";
import { TeamService, teamType } from "../service/teamService";
import { generateShortId } from "../utils";
import { UserService } from "../service/userService";
import redis from "../config/redis";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();
const teamService = new TeamService();
const userService = new UserService();

router.post("/create", async (req: Request, res: Response) => {
  try {
    const { name, ownerId, tags, description } = req.body;
    const teamId = +generateShortId();
    const owner = await userService.getUser(ownerId);
    // 插入团队表
    const team: teamType = {
      id: teamId,
      name,
      ownerId,
      owner,
      members: [owner], //自动加入 team_user 表
      tags,
      description,
    };
    const data = await teamService.save(team);

    return res.suc(data);
  } catch (err) {
    console.error(err);
    return res.fail("创建团队失败");
  }
});

// 只有创建人有权利解散团队
router.delete("/delete/:id", async (req: Request, res: Response) => {
  const id = +req.params.id;
  const data = await teamService.delete(id);
  return res.suc(data);
});

// 生成邀请链接
router.get("/:teamId/invite", async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    if (!teamId) return res.status(400).json({ message: "teamId 必填" });

    // 生成唯一 token
    const token = uuidv4();

    // 将 token 和 teamId 绑定到 Redis 1天过期
    await redis.set(`team_invite:${token}`, teamId, "EX", 60 * 60 * 24);

    // 返回完整邀请链接
    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3002";
    const inviteLink = `${frontendUrl}/join?token=${token}`;

    return res.suc(inviteLink);
  } catch (error) {
    console.error(error);
    return res.fail("生成邀请链接失败");
  }
});

router.post("/join", async (req: Request, res: Response) => {
  try {
    const { token, userId } = req.body;
    if (!token || !userId)
      return res.status(400).json({ message: "token 和 userId 必填" });

    const key = `team_invite:${token}`;
    const teamId = await redis.get(key);

    if (!teamId) {
      return res.status(400).json({ message: "邀请链接无效或已过期" });
    }

    // 将用户加入团队
    await teamService.addMember(Number(teamId), userId);

    // 删除 token，标记已使用
    await redis.del(key);

    return res.json({ message: "加入团队成功", teamId });
  } catch (error) {
    console.error("The join error is:", error);
    return res.status(500).json({ message: "加入团队失败", error });
  }
});

router.get("/findAll/:id", async (req: Request, res: Response) => {
  try {
    const data = await teamService.findAll(+req.params.id);
    return res.suc(data);
  } catch (error) {
    console.log(error);
    return res.fail(error);
  }
});

// 成员只能退出
router.post("/exit", async (req: Request, res: Response) => {
  try {
    const { teamId, userId } = req.body;
    const data = await teamService.leaveTeam(teamId, userId);
    return res.suc(data);
  } catch (error) {
    console.log(error);
    return res.fail(error);
  }
});

// 查询团队成员
router.get("/:id/teammates", async (req: Request, res: Response) => {
  try {
    const data = await teamService.getTeammates(+req.params.id);
    return res.suc(data);
  } catch (error) {
    console.log(error);
    return res.fail(error);
  }
});

router.put("/update/:id", async (req: Request, res: Response) => {
  try {
    const teamId = +req.params.id;
    const { name, description, tags } = req.body;

    if (!name) {
      return res.status(400).json({ message: "团队名称不能为空" });
    }

    const updatedTeam = await teamService.updateTeam(teamId, {
      name,
      description,
      tags,
    });

    return res.suc(updatedTeam);
  } catch (error) {
    console.error(error);
    return res.fail(error);
  }
});
export default router;
