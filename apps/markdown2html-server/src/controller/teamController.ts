import express, { Response, Request } from "express";
import { TeamService, teamType } from "../service/teamService";
import { generateShortId } from "../utils";
import { UserService } from "../service/userService";

const router = express.Router();
const teamService = new TeamService();
const userService = new UserService();

router.post("/create", async (req: Request, res: Response) => {
  try {
    const { name, ownerId } = req.body;
    const teamId = +generateShortId();
    const owner = await userService.getUser(ownerId);
    // 插入团队表
    const team: teamType = {
      id: teamId,
      name,
      ownerId,
      owner,
      members: [owner], //自动加入 team_user 表
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

router.post("/join", async (req: Request, res: Response) => {
  try {
    const { teamId, userId } = req.body;

    const data = await teamService.addMember(teamId, userId);

    return res.suc(data);
  } catch (error) {
    console.log("The join error is:", error);
    return res.fail(error);
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
export default router;
