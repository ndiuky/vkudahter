import fs from "fs";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ownerId = process.env.OWNER_ID;

const limit = process.env.REQUEST_LIMIT;

const token = process.env.TOKEN;

let offset = 0;

const api = async (method, args) => {
  let a = "";
  for (let argsKey in args) {
    a += "&" + argsKey + "=" + args[argsKey];
  }
  return (
    await axios.get(
      "https://api.vk.com/method/" +
        method +
        "?v=5.131&access_token=" +
        token +
        a,
    )
  ).data;
};

(async () => {
  const items = [];

  while (true) {
    const res = await api("photos.getAll", {
      owner_id: ownerId,
      extended: 1,
      photo_sizes: 1,
      count: limit,
      offset: offset,
    });

    items.push(...res.response.items);

    if (res.response.count < limit) {
      break;
    }

    offset += limit;
  }

  const promises = items.map(async (item) => {
    const max = item.sizes.reduce(
      (max, size) => (size.width > max.width ? size : max),
      item.sizes[0],
    );
    const date = new Date(item.date * 1000);
    const filename = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}_${date.getHours()}-${date.getMinutes()}-${date.getSeconds()}_${item.id}.jpg`;

    try {
      const res = await Axios.get(max.url, { responseType: "stream" });

      const writer = fs.createWriteStream(`out/${filename}`);

      res.data.pipe(writer);

      await new Promise((resolve) => {
        writer.on("close", async () => {
          resolve();
        });
      });
    } catch (e) {
      console.log(max.url);
    }
  });
  await Promise.all(promises);
})();
