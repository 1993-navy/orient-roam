import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { computeWeightScore } from "../src/lib/recommendation";

const prisma = new PrismaClient();

type SeedPlace = {
  name: string;
  nameEn: string;
  category: string;
  lng: number;
  lat: number;
  address?: string;
  description?: string;
  priceLevel?: number;
};

type SeedCity = {
  name: string;
  nameEn: string;
  province: string;
  lat: number;
  lng: number;
  summary: string;
  tier: string;
  isLivable: boolean;
  history?: string;
  historyEn?: string;
  culture?: string;
  cultureEn?: string;
  cuisine?: string;
  cuisineEn?: string;
  landmarks?: string;
  landmarksEn?: string;
  stories?: string;
  storiesEn?: string;
  places: SeedPlace[];
};

const CITIES: SeedCity[] = [
  {
    name: "北京",
    nameEn: "Beijing",
    province: "Beijing",
    lat: 39.9042,
    lng: 116.4074,
    summary: "China's capital — imperial palaces, the Great Wall, and world-class Peking duck.",
    tier: "MEGA",
    isLivable: false,
    history: "北京是中国的首都，拥有3000多年的建城史和850多年的建都史。自金朝开始，北京先后成为辽、金、元、明、清五个朝代的都城，是中国历史上最重要的政治和文化中心之一。",
    historyEn: "Beijing, the capital of China, has over 3,000 years of urban history and 850 years as an imperial capital. It served as the capital for five dynasties: Liao, Jin, Yuan, Ming, and Qing, making it one of China's most important political and cultural centers.",
    culture: "北京文化融合了皇家文化、市井文化和多元文化。京剧作为中国国粹诞生于此，四合院是北京传统民居的代表，胡同文化展现了老北京的生活风貌。",
    cultureEn: "Beijing culture blends imperial traditions, local folk customs, and diverse influences. Peking Opera, China's national treasure, originated here. Siheyuan courtyard houses represent traditional Beijing architecture, and hutong alleyways showcase old Beijing life.",
    cuisine: "北京菜以宫廷菜和民间菜为特色，最著名的是北京烤鸭。其他特色美食包括涮羊肉、炸酱面、豆汁儿、卤煮火烧等，体现了北方饮食的厚重与讲究。",
    cuisineEn: "Beijing cuisine features imperial dishes and local specialties. The most famous is Peking duck. Other highlights include Mongolian hot pot, zhajiang noodles, douzhi (fermented bean drink), and luzhu huoshao (stewed offal soup).",
    landmarks: "北京拥有众多世界级文化遗产，包括故宫、天坛、颐和园、八达岭长城、明十三陵等。天安门广场是世界上最大的城市广场，见证了中国近代史上的重要事件。",
    landmarksEn: "Beijing boasts numerous UNESCO World Heritage Sites: Forbidden City, Temple of Heaven, Summer Palace, Badaling Great Wall, and Ming Tombs. Tiananmen Square, the world's largest public square, has witnessed key events in modern Chinese history.",
    stories: "北京有着丰富的民间传说和历史典故。传说中，哪吒闹海的故事发生在北京附近；燕京八景描绘了北京的美景；故宫的九龙壁背后有着工匠们的智慧传说。",
    storiesEn: "Beijing is rich in folklore and historical tales. Legend has it that Nezha's sea battle took place near Beijing. The Eight Great Sights of Yanjing depict the city's beauty. Behind the Nine-Dragon Wall in the Forbidden City lies a story of artisans' ingenuity.",
    places: [
      { name: "故宫博物院", nameEn: "Forbidden City", category: "ATTRACTION", lng: 116.397, lat: 39.918, description: "The imperial palace of the Ming and Qing dynasties.", priceLevel: 2 },
      { name: "天坛公园", nameEn: "Temple of Heaven", category: "ATTRACTION", lng: 116.412, lat: 39.882, description: "Ming-era altar complex set in a vast park.", priceLevel: 1 },
      { name: "八达岭长城", nameEn: "Badaling Great Wall", category: "NATURE", lng: 116.016, lat: 40.356, description: "The most popular section of the Great Wall.", priceLevel: 2 },
      { name: "全聚德烤鸭店", nameEn: "Quanjude Roast Duck", category: "FOOD", lng: 116.398, lat: 39.899, description: "Historic Peking duck restaurant since 1864.", priceLevel: 3 },
      { name: "后海酒吧街", nameEn: "Houhai Bar Street", category: "NIGHTLIFE", lng: 116.384, lat: 39.94, description: "Lakeside bars and live music in old Beijing.", priceLevel: 2 },
      { name: "王府井大街", nameEn: "Wangfujing Street", category: "SHOPPING", lng: 116.41, lat: 39.914, description: "Beijing's famous pedestrian shopping street.", priceLevel: 2 },
      { name: "北京饭店", nameEn: "Beijing Hotel", category: "HOTEL", lng: 116.408, lat: 39.909, description: "Landmark hotel steps from Tiananmen Square.", priceLevel: 4 },
    ],
  },
  {
    name: "上海",
    nameEn: "Shanghai",
    province: "Shanghai",
    lat: 31.2304,
    lng: 121.4737,
    summary: "China's dazzling financial hub — colonial Bund, futuristic skyline, and dumplings.",
    tier: "MEGA",
    isLivable: false,
    history: "上海历史悠久，早在宋代就已形成聚落。1843年开埠后，上海迅速发展成为远东最大的港口和金融中心，被称为'十里洋场'。",
    historyEn: "Shanghai has a long history dating back to the Song Dynasty. After being opened as a treaty port in 1843, it rapidly became the largest port and financial center in the Far East, known as the 'Paris of the East'.",
    culture: "海派文化是上海的独特文化形态，融合了中国传统文化与西方文化。上海是中国现代文学、电影、音乐的发源地之一，旗袍文化也在这里发扬光大。",
    cultureEn: "Haipai (Shanghai-style) culture is a unique blend of traditional Chinese and Western influences. Shanghai is a birthplace of modern Chinese literature, film, and music, and is famous for its cheongsam fashion culture.",
    cuisine: "上海菜以浓油赤酱、咸甜适中为特色。著名的本帮菜有红烧肉、响油鳝糊、蟹粉豆腐等。小笼包是上海最具代表性的点心，皮薄汁多，鲜美无比。",
    cuisineEn: "Shanghai cuisine is known for rich sauces, savory-sweet flavors. Famous local dishes include red-braised pork, stir-fried eel, and crab meat tofu. Shanghai soup dumplings (xiaolongbao) are world-renowned for their thin skin and rich broth.",
    landmarks: "上海的标志性建筑包括外滩万国建筑群、东方明珠塔、上海中心大厦、豫园、南京路步行街等。外滩的夜景被誉为'万国建筑博览群'。",
    landmarksEn: "Shanghai's iconic landmarks include the Bund's colonial architecture, Oriental Pearl Tower, Shanghai Tower, Yu Garden, and Nanjing Road Pedestrian Street. The Bund's night view is known as a 'museum of international architecture'.",
    stories: "上海有着许多传奇故事，如白娘子传说中的雷峰塔虽在杭州，但法海与金山寺的故事在江南广为流传。上海的弄堂文化也孕育了许多市井传奇。",
    storiesEn: "Shanghai has many legendary tales. While the Leifeng Pagoda from the White Snake legend is in Hangzhou, the story of Fahai and Jinshan Temple is famous across the Yangtze Delta. Shanghai's lane culture has also spawned many folk legends.",
    places: [
      { name: "外滩", nameEn: "The Bund", category: "ATTRACTION", lng: 121.49, lat: 31.24, description: "Riverside promenade with colonial-era architecture.", priceLevel: 1 },
      { name: "豫园", nameEn: "Yu Garden", category: "ATTRACTION", lng: 121.492, lat: 31.227, description: "Classical Ming-dynasty garden in the old city.", priceLevel: 2 },
      { name: "南翔馒头店", nameEn: "Nanxiang Steamed Buns", category: "FOOD", lng: 121.492, lat: 31.2272, description: "The original home of Shanghai soup dumplings.", priceLevel: 2 },
      { name: "新天地", nameEn: "Xintiandi", category: "NIGHTLIFE", lng: 121.475, lat: 31.22, description: "Upscale dining and nightlife in restored shikumen.", priceLevel: 3 },
      { name: "田子坊", nameEn: "Tianzifang", category: "SHOPPING", lng: 121.467, lat: 31.211, description: "Artsy lanes full of boutiques and cafes.", priceLevel: 2 },
      { name: "和平饭店", nameEn: "Fairmont Peace Hotel", category: "HOTEL", lng: 121.486, lat: 31.24, description: "Art-deco icon on the Bund.", priceLevel: 4 },
    ],
  },
  {
    name: "广州",
    nameEn: "Guangzhou",
    province: "Guangdong",
    lat: 23.1291,
    lng: 113.2644,
    summary: "Southern China's vibrant capital — Cantonese cuisine, ancient temples, and modern malls.",
    tier: "MEGA",
    isLivable: false,
    history: "广州是中国南方的门户，古称'番禺'，拥有2200多年的建城史。自秦汉以来就是海上丝绸之路的起点，是中国对外开放最早的城市之一。",
    historyEn: "Guangzhou, ancient name Panyu, is the gateway to southern China with over 2,200 years of history. It was the starting point of the Maritime Silk Road since the Qin and Han dynasties, and one of China's earliest open cities.",
    culture: "岭南文化是广州文化的核心，以开放、务实、创新为特点。粤剧是岭南文化的瑰宝，醒狮表演展现了岭南人民的豪迈气概。",
    cultureEn: "Lingnan culture is the core of Guangzhou's cultural identity, characterized by openness, practicality, and innovation. Cantonese opera is a treasure of Lingnan culture, and lion dance performances showcase the bold spirit of Lingnan people.",
    cuisine: "粤菜是中国八大菜系之一，以清淡鲜美、讲究原味著称。广州的早茶文化闻名天下，点心种类繁多。著名美食有白切鸡、烧鹅、叉烧、老火靓汤等。",
    cuisineEn: "Cantonese cuisine, one of China's eight major culinary traditions, is known for its light, fresh flavors and emphasis on original taste. Guangzhou's morning tea culture is world-famous with a vast variety of dim sum. Famous dishes include white-cut chicken, roasted goose, char siu, and slow-cooked soup.",
    landmarks: "广州塔是中国第一高塔，小蛮腰造型独具特色。陈家祠是岭南建筑艺术的巅峰之作，沙面岛保留了大量欧式建筑。白云山是广州的城市绿肺。",
    landmarksEn: "Canton Tower is China's tallest tower with its distinctive 'slender waist' design. Chen Clan Ancestral Hall represents the pinnacle of Lingnan architecture. Shamian Island preserves numerous European-style buildings. Baiyun Mountain is Guangzhou's urban green lung.",
    stories: "广州有许多美丽的传说，如五羊传说讲述了仙人骑羊送稻穗的故事，成为广州'羊城'之名的由来。光孝寺内的菩提树有着千年历史。",
    storiesEn: "Guangzhou has many beautiful legends, such as the Five Goats legend about immortals riding goats to bring rice ears, giving Guangzhou its nickname 'City of Goats'. The banyan tree in Guangxiao Temple has a thousand-year history.",
    places: [
      { name: "广州塔", nameEn: "Canton Tower", category: "ATTRACTION", lng: 113.321, lat: 23.104, description: "Iconic tower with panoramic views of the city.", priceLevel: 3 },
      { name: "陈家祠", nameEn: "Chen Clan Ancestral Hall", category: "ATTRACTION", lng: 113.264, lat: 23.137, description: "Exquisite traditional architecture with intricate carvings.", priceLevel: 2 },
      { name: "陶陶居", nameEn: "Taotaoju", category: "FOOD", lng: 113.258, lat: 23.126, description: "Famous Cantonese dim sum restaurant since 1880.", priceLevel: 3 },
      { name: "上下九步行街", nameEn: "Shangxiajiu Pedestrian Street", category: "SHOPPING", lng: 113.254, lat: 23.122, description: "Historic shopping street with local snacks and goods.", priceLevel: 1 },
      { name: "白云山", nameEn: "Baiyun Mountain", category: "NATURE", lng: 113.218, lat: 23.193, description: "Scenic mountain park with hiking trails and cable cars.", priceLevel: 1 },
    ],
  },
  {
    name: "深圳",
    nameEn: "Shenzhen",
    province: "Guangdong",
    lat: 22.5431,
    lng: 114.0579,
    summary: "China's Silicon Valley — ultra-modern skyline, theme parks, and seafood.",
    tier: "MEGA",
    isLivable: true,
    history: "深圳原是一个小渔村，1980年成为中国第一个经济特区，短短40年间发展成为国际化大都市，创造了举世瞩目的'深圳速度'。",
    historyEn: "Shenzhen was originally a small fishing village. In 1980, it became China's first Special Economic Zone. Within just 40 years, it transformed into an international metropolis, creating the world-renowned 'Shenzhen Speed'.",
    culture: "深圳是一座年轻的移民城市，文化多元包容。客家文化、广府文化与现代潮流在这里交融，形成了独特的创新文化氛围。",
    cultureEn: "Shenzhen is a young immigrant city with diverse and inclusive culture. Hakka culture, Cantonese culture, and modern trends blend here, creating a unique innovative cultural atmosphere.",
    cuisine: "深圳美食汇聚八方风味，以海鲜和客家菜为特色。光明乳鸽是深圳著名特产，沙井生蚝鲜美无比，早茶文化也十分发达。",
    cuisineEn: "Shenzhen's cuisine brings together flavors from across China, featuring seafood and Hakka dishes. Guangming pigeon is a famous local specialty, Shajing oysters are delicious, and morning tea culture is also well-developed.",
    landmarks: "深圳湾公园可眺望香港，世界之窗展示了全球著名景点的微缩景观。平安金融中心是深圳最高建筑，大梅沙海滩是著名的滨海度假胜地。",
    landmarksEn: "Shenzhen Bay Park offers views of Hong Kong. Window of the World showcases miniature replicas of global landmarks. Ping An Finance Center is Shenzhen's tallest building. Dameisha Beach is a famous coastal resort.",
    stories: "深圳有'鹏城'的别称，源于古代大鹏守御千户所的历史。传说中大鹏鸟展翅高飞的形象象征着深圳的腾飞与发展。",
    storiesEn: "Shenzhen is also known as 'Pengcheng' (City of Peng), named after the ancient Dapeng Fortress. The legendary roc bird soaring high symbolizes Shenzhen's rapid development.",
    places: [
      { name: "深圳湾公园", nameEn: "Shenzhen Bay Park", category: "NATURE", lng: 113.906, lat: 22.498, description: "Coastal park with stunning views of Hong Kong.", priceLevel: 1 },
      { name: "世界之窗", nameEn: "Window of the World", category: "ATTRACTION", lng: 113.989, lat: 22.544, description: "Theme park with miniature replicas of global landmarks.", priceLevel: 3 },
      { name: "东门老街", nameEn: "Dongmen Old Street", category: "SHOPPING", lng: 114.077, lat: 22.547, description: "Bustling shopping area with street food and boutiques.", priceLevel: 1 },
      { name: "平安金融中心", nameEn: "Ping An Finance Center", category: "ATTRACTION", lng: 114.059, lat: 22.540, description: "One of the tallest buildings in China with observation deck.", priceLevel: 3 },
      { name: "深圳华侨城洲际大酒店", nameEn: "InterContinental Shenzhen", category: "HOTEL", lng: 113.986, lat: 22.546, description: "Luxury hotel with Mediterranean-style architecture.", priceLevel: 4 },
    ],
  },
  {
    name: "杭州",
    nameEn: "Hangzhou",
    province: "Zhejiang",
    lat: 30.2741,
    lng: 120.1551,
    summary: "Venice of the East — West Lake, tea plantations, and silk.",
    tier: "FIRST",
    isLivable: true,
    history: "杭州是中国七大古都之一，五代吴越国和南宋王朝曾在此建都。杭州风景秀丽，素有'上有天堂，下有苏杭'的美誉。",
    historyEn: "Hangzhou is one of China's seven ancient capitals, serving as the capital of the Wuyue Kingdom and Southern Song Dynasty. Known for its scenic beauty, it shares the saying 'Above there is heaven, below there are Suzhou and Hangzhou'.",
    culture: "杭州文化底蕴深厚，是良渚文化的发源地。西湖文化是杭州的灵魂，龙井茶文化、丝绸文化、南宋文化在这里交相辉映。",
    cultureEn: "Hangzhou has profound cultural heritage, being the birthplace of Liangzhu culture. West Lake culture is the soul of Hangzhou, with Longjing tea culture, silk culture, and Southern Song culture shining together.",
    cuisine: "杭帮菜以清淡鲜美、原汁原味为特色。西湖醋鱼、龙井虾仁、叫化鸡是杭州三大名菜。杭州的小笼包和东坡肉也闻名遐迩。",
    cuisineEn: "Hangzhou cuisine features light, fresh flavors and original taste. West Lake vinegar fish, Longjing shrimp, and beggar's chicken are Hangzhou's three famous dishes. Xiaolongbao and Dongpo pork are also well-known.",
    landmarks: "西湖是杭州的名片，十景各具特色。灵隐寺是江南著名古刹，雷峰塔因白娘子传说而闻名。千岛湖是风景秀丽的人工湖。",
    landmarksEn: "West Lake is Hangzhou's symbol with ten scenic spots. Lingyin Temple is a famous ancient temple in southern China. Leifeng Pagoda is famous for the White Snake legend. Qiandao Lake is a scenic artificial lake.",
    stories: "白娘子与许仙的爱情传说就发生在西湖畔。传说中，白娘子为救许仙水漫金山寺，后被法海镇于雷峰塔下。这个故事表达了人们对美好爱情的向往。",
    storiesEn: "The love story of White Snake (Bai Suzhen) and Xu Xian took place by West Lake. Legend says Bai Suzhen flooded Jinshan Temple to save Xu Xian, and was later trapped under Leifeng Pagoda by Fahai. This story expresses people's longing for true love.",
    places: [
      { name: "西湖", nameEn: "West Lake", category: "NATURE", lng: 120.15, lat: 30.27, description: "Scenic lake with pagodas, gardens, and boat rides.", priceLevel: 1 },
      { name: "灵隐寺", nameEn: "Lingyin Temple", category: "ATTRACTION", lng: 120.14, lat: 30.23, description: "Ancient Buddhist temple in a forested valley.", priceLevel: 2 },
      { name: "楼外楼", nameEn: "Louwailou", category: "FOOD", lng: 120.155, lat: 30.268, description: "Famous restaurant serving Hangzhou cuisine since 1848.", priceLevel: 4 },
      { name: "河坊街", nameEn: "Hefang Street", category: "SHOPPING", lng: 120.152, lat: 30.259, description: "Traditional street with silk shops and local snacks.", priceLevel: 2 },
      { name: "龙井茶园", nameEn: "Longjing Tea Plantation", category: "NATURE", lng: 120.13, lat: 30.20, description: "Scenic tea hills producing China's finest green tea.", priceLevel: 2 },
    ],
  },
  {
    name: "南京",
    nameEn: "Nanjing",
    province: "Jiangsu",
    lat: 32.0603,
    lng: 118.7969,
    summary: "Ancient capital — Ming tombs, Confucius Temple, and duck.",
    tier: "FIRST",
    isLivable: false,
    history: "南京是中国四大古都之一，先后有东吴、东晋、南朝宋齐梁陈、南唐、明、太平天国、中华民国等在此建都，有'六朝古都'、'十朝都会'之称。",
    historyEn: "Nanjing is one of China's four ancient capitals, having served as the capital for six dynasties (Eastern Wu, Eastern Jin, Southern Dynasties) and ten regimes total. It is known as the 'Capital of Six Dynasties'.",
    culture: "南京文化兼具南北特色，是吴文化的重要发源地。南京的云锦织造技艺世界闻名，金陵画派在中国绘画史上占有重要地位。",
    cultureEn: "Nanjing culture blends northern and southern traditions, and is an important birthplace of Wu culture. Nanjing brocade weaving is world-famous, and the Jinling painting school holds an important place in Chinese art history.",
    cuisine: "南京菜又称金陵菜，以炖、焖、蒸、炒为主要技法。盐水鸭是南京最著名的美食，鸭血粉丝汤是街头小吃的代表。夫子庙小吃种类繁多。",
    cuisineEn: "Nanjing cuisine, also known as Jinling cuisine, features stewing, braising, steaming, and stir-frying. Salted duck is Nanjing's most famous dish, and duck blood vermicelli soup is a street food staple. Confucius Temple area offers many local snacks.",
    landmarks: "中山陵是孙中山先生的陵墓，气势恢宏。明孝陵是明朝开国皇帝朱元璋的陵墓，是世界文化遗产。夫子庙秦淮风光带展现了南京的历史风貌。",
    landmarksEn: "Sun Yat-sen Mausoleum is the tomb of Dr. Sun Yat-sen with impressive architecture. Ming Xiaoling Mausoleum is the tomb of Ming founder Zhu Yuanzhang, a UNESCO World Heritage Site. Confucius Temple along the Qinhuai River showcases Nanjing's historical charm.",
    stories: "南京有许多历史典故，如'青梅竹马'出自李白的诗，描述了李白与表妹在南京玩耍的情景。乌衣巷的故事讲述了王谢两大望族的兴衰。",
    storiesEn: "Nanjing has many historical allusions. 'Qingmei Zhuma' (childhood sweethearts) comes from Li Bai's poem about playing with his cousin in Nanjing. The story of Wuyi Lane tells of the rise and fall of the Wang and Xie families.",
    places: [
      { name: "中山陵", nameEn: "Sun Yat-sen Mausoleum", category: "ATTRACTION", lng: 118.838, lat: 32.056, description: "Tomb of China's founding father with stunning architecture.", priceLevel: 1 },
      { name: "夫子庙", nameEn: "Confucius Temple", category: "ATTRACTION", lng: 118.792, lat: 32.022, description: "Ancient temple complex along the Qinhuai River.", priceLevel: 2 },
      { name: "南京博物院", nameEn: "Nanjing Museum", category: "ATTRACTION", lng: 118.808, lat: 32.036, description: "One of China's largest museums with imperial treasures.", priceLevel: 1 },
      { name: "鸭血粉丝汤", nameEn: "Duck Blood Vermicelli Soup", category: "FOOD", lng: 118.793, lat: 32.023, description: "Nanjing's iconic street food dish.", priceLevel: 1 },
      { name: "明孝陵", nameEn: "Ming Xiaoling Mausoleum", category: "ATTRACTION", lng: 118.842, lat: 32.044, description: "World Heritage Site — tomb of the Ming dynasty founder.", priceLevel: 2 },
    ],
  },
  {
    name: "武汉",
    nameEn: "Wuhan",
    province: "Hubei",
    lat: 30.5928,
    lng: 114.3055,
    summary: "Central China's hub — Yangtze River, hot dry noodles, and cherry blossoms.",
    tier: "FIRST",
    isLivable: false,
    history: "武汉由武昌、汉口、汉阳三镇组成，有着3500年的历史。武汉是辛亥革命的发源地，也是中国重要的工业基地和交通枢纽。",
    historyEn: "Wuhan consists of three towns: Wuchang, Hankou, and Hanyang, with a 3,500-year history. It is the birthplace of the 1911 Revolution and an important industrial base and transportation hub in China.",
    culture: "武汉文化融合了楚文化、三国文化和近代革命文化。黄鹤楼是武汉文化的象征，编钟音乐展现了古代楚文化的辉煌。",
    cultureEn: "Wuhan culture blends Chu culture, Three Kingdoms culture, and modern revolutionary culture. Yellow Crane Tower is a cultural symbol of Wuhan, and chime bell music showcases the glory of ancient Chu civilization.",
    cuisine: "武汉饮食以热干面最为著名，是武汉人的早餐首选。武昌鱼因毛主席的诗句而闻名，周黑鸭是武汉著名的卤味品牌。",
    cuisineEn: "Wuhan's most famous food is hot dry noodles, the preferred breakfast for locals. Wuchang fish became famous due to Chairman Mao's poem. Zhou Hei Ya is a famous Wuhan braised duck brand.",
    landmarks: "黄鹤楼是江南三大名楼之一，登高可俯瞰长江美景。东湖是中国最大的城中湖，春季樱花盛开美不胜收。长江大桥是武汉的标志性建筑。",
    landmarksEn: "Yellow Crane Tower is one of the three famous towers south of the Yangtze, offering panoramic views of the river. East Lake is China's largest urban lake, famous for cherry blossoms in spring. Yangtze River Bridge is Wuhan's iconic landmark.",
    stories: "黄鹤楼有着许多动人的传说，最著名的是仙人乘鹤归来的故事。传说古代有一位仙人在此乘鹤而去，留下了'昔人已乘黄鹤去，此地空余黄鹤楼'的千古名句。",
    storiesEn: "Yellow Crane Tower has many fascinating legends, most famously the story of an immortal riding a crane away. Legend says an immortal rode a crane from this spot, leaving behind the famous poem 'Once the yellow crane left, only the tower remains'.",
    places: [
      { name: "黄鹤楼", nameEn: "Yellow Crane Tower", category: "ATTRACTION", lng: 114.327, lat: 30.551, description: "Famous historic tower with river views.", priceLevel: 2 },
      { name: "东湖", nameEn: "East Lake", category: "NATURE", lng: 114.362, lat: 30.558, description: "Scenic lake with cherry blossoms in spring.", priceLevel: 1 },
      { name: "热干面", nameEn: "Hot Dry Noodles", category: "FOOD", lng: 114.306, lat: 30.593, description: "Wuhan's signature breakfast dish.", priceLevel: 1 },
      { name: "户部巷", nameEn: "Hubu Lane", category: "FOOD", lng: 114.322, lat: 30.549, description: "Famous food street with local snacks.", priceLevel: 1 },
      { name: "长江大桥", nameEn: "Yangtze River Bridge", category: "ATTRACTION", lng: 114.325, lat: 30.548, description: "Iconic bridge connecting Wuhan's districts.", priceLevel: 1 },
    ],
  },
  {
    name: "重庆",
    nameEn: "Chongqing",
    province: "Chongqing",
    lat: 29.5630,
    lng: 106.5516,
    summary: "Mountain city — spicy hotpot, cable cars, and dramatic skyline.",
    tier: "FIRST",
    isLivable: false,
    history: "重庆古称'渝州'，是巴渝文化的发源地。抗战时期曾是国民政府的陪都，留下了丰富的抗战文化遗产。",
    historyEn: "Chongqing, ancient name Yuzhou, is the birthplace of Bayu culture. During WWII, it served as the provisional capital of the Nationalist government, leaving rich wartime heritage.",
    culture: "巴渝文化是重庆文化的核心，以热情豪爽为特点。川剧变脸是重庆文化的一绝，巴山夜雨的意境令人陶醉。",
    cultureEn: "Bayu culture is the core of Chongqing's identity, characterized by enthusiasm and boldness. Sichuan opera face-changing is a highlight of Chongqing culture, and the poetic imagery of 'night rain on Bashan mountains' is enchanting.",
    cuisine: "重庆火锅是中国火锅的代表，以麻辣鲜香著称。小面是重庆人的日常美食，酸辣粉、毛血旺也是必尝的特色小吃。",
    cuisineEn: "Chongqing hotpot is the representative of Chinese hotpot, famous for its spicy and numbing flavors. Chongqing noodles are a daily staple, and hot and sour noodles, blood curd soup are must-try snacks.",
    landmarks: "洪崖洞是重庆最具特色的吊脚楼建筑群，夜景美不胜收。解放碑是重庆的地标，长江索道是体验山城特色的最佳方式。",
    landmarksEn: "Hongya Cave features traditional stilt houses with stunning night views. Jiefangbei is Chongqing's landmark. Yangtze River Cableway offers the best way to experience the mountain city.",
    stories: "重庆有'山城'之称，传说中大禹治水曾三过家门而不入，其故事在重庆广为流传。巫山神女的传说讲述了神女峰的由来。",
    storiesEn: "Chongqing is called the 'Mountain City'. Legend says Yu the Great passed his home three times without entering while controlling floods. The story of the Goddess of Wushan explains the origin of Shennv Peak.",
    places: [
      { name: "洪崖洞", nameEn: "Hongya Cave", category: "ATTRACTION", lng: 106.554, lat: 29.565, description: "Traditional stilt houses overlooking the Jialing River.", priceLevel: 1 },
      { name: "解放碑", nameEn: "Jiefangbei", category: "ATTRACTION", lng: 106.558, lat: 29.557, description: "Iconic monument and shopping district.", priceLevel: 1 },
      { name: "重庆火锅", nameEn: "Chongqing Hotpot", category: "FOOD", lng: 106.556, lat: 29.559, description: "World-famous spicy hotpot with numbing Sichuan peppercorns.", priceLevel: 2 },
      { name: "长江索道", nameEn: "Yangtze River Cableway", category: "ATTRACTION", lng: 106.574, lat: 29.558, description: "Scenic cable car ride across the Yangtze River.", priceLevel: 2 },
      { name: "磁器口古镇", nameEn: "Ciqikou Ancient Town", category: "SHOPPING", lng: 106.477, lat: 29.602, description: "Historic riverside town with snacks and crafts.", priceLevel: 1 },
    ],
  },
  {
    name: "西安",
    nameEn: "Xi'an",
    province: "Shaanxi",
    lat: 34.3416,
    lng: 108.9398,
    summary: "Ancient capital and Silk Road gateway — Terracotta Army and legendary street food.",
    tier: "FIRST",
    isLivable: false,
    history: "西安古称'长安'，是中华文明的重要发祥地，先后有周、秦、汉、唐等十三个朝代在此建都，是丝绸之路的起点。",
    historyEn: "Xi'an, ancient name Chang'an, is a cradle of Chinese civilization. Thirteen dynasties including Zhou, Qin, Han, and Tang made it their capital. It was the starting point of the Silk Road.",
    culture: "长安文化博大精深，唐文化是西安文化的巅峰。兵马俑展现了秦代的辉煌，大雁塔见证了佛教的传入与发展。",
    cultureEn: "Chang'an culture is profound and extensive, with Tang dynasty culture representing its peak. Terracotta Army showcases Qin dynasty glory, and Big Wild Goose Pagoda witnessed the introduction of Buddhism.",
    cuisine: "西安是中国面食之都，羊肉泡馍、肉夹馍、凉皮、油泼面等都是著名美食。回民街汇聚了丰富的清真小吃。",
    cuisineEn: "Xi'an is the capital of Chinese noodles. Famous dishes include lamb paomo soup, roujiamo (Chinese hamburger), cold noodles, and oil-splashed noodles. The Muslim Quarter offers rich halal snacks.",
    landmarks: "兵马俑是世界第八大奇迹，西安城墙是中国保存最完整的古城墙。大雁塔是唐代佛教建筑的杰作，华山以险峻著称。",
    landmarksEn: "Terracotta Army is the 8th Wonder of the World. Xi'an City Wall is China's most complete ancient city wall. Big Wild Goose Pagoda is a masterpiece of Tang Buddhist architecture. Mount Hua is famous for its steep trails.",
    stories: "西安有着许多传奇故事，如牛郎织女的传说就发生在西安附近的鹊桥。大雁塔的修建与玄奘西行取经的故事紧密相连。",
    storiesEn: "Xi'an has many legendary tales. The Cowherd and Weaver Girl legend is said to have occurred near Xi'an. The construction of Big Wild Goose Pagoda is closely linked to Xuanzang's journey to India for Buddhist scriptures.",
    places: [
      { name: "秦始皇兵马俑", nameEn: "Terracotta Army", category: "ATTRACTION", lng: 109.278, lat: 34.385, description: "Thousands of life-size clay warriors guarding an emperor's tomb.", priceLevel: 3 },
      { name: "西安城墙", nameEn: "Xi'an City Wall", category: "ATTRACTION", lng: 108.94, lat: 34.26, description: "China's most complete ancient city wall — rent a bike on top.", priceLevel: 2 },
      { name: "回民街", nameEn: "Muslim Quarter", category: "FOOD", lng: 108.94, lat: 34.267, description: "Bustling street-food bazaar of the Hui community.", priceLevel: 1 },
      { name: "大雁塔", nameEn: "Big Wild Goose Pagoda", category: "ATTRACTION", lng: 108.964, lat: 34.219, description: "Tang-dynasty Buddhist pagoda with a nightly fountain show.", priceLevel: 2 },
      { name: "华山", nameEn: "Mount Hua", category: "NATURE", lng: 110.083, lat: 34.479, description: "One of China's Five Great Mountains, famed for vertigo-inducing trails.", priceLevel: 3 },
    ],
  },
  {
    name: "成都",
    nameEn: "Chengdu",
    province: "Sichuan",
    lat: 30.5728,
    lng: 104.0668,
    summary: "Laid-back capital of Sichuan — giant pandas, teahouses, and mouth-numbing hotpot.",
    tier: "FIRST",
    isLivable: true,
    places: [
      { name: "成都大熊猫繁育研究基地", nameEn: "Giant Panda Base", category: "NATURE", lng: 104.146, lat: 30.733, description: "See giant pandas up close, best in the morning.", priceLevel: 2 },
      { name: "锦里古街", nameEn: "Jinli Ancient Street", category: "FOOD", lng: 104.043, lat: 30.643, description: "Snack-packed historic lane beside Wuhou Shrine.", priceLevel: 1 },
      { name: "宽窄巷子", nameEn: "Kuanzhai Alley", category: "ATTRACTION", lng: 104.054, lat: 30.669, description: "Restored Qing-era alleys of teahouses and bars.", priceLevel: 2 },
      { name: "陈麻婆豆腐", nameEn: "Chen Mapo Tofu", category: "FOOD", lng: 104.066, lat: 30.665, description: "Birthplace of the iconic mapo tofu dish.", priceLevel: 2 },
      { name: "青城山", nameEn: "Mount Qingcheng", category: "NATURE", lng: 103.516, lat: 30.901, description: "Misty, forested cradle of Taoism — a UNESCO site.", priceLevel: 2 },
    ],
  },
  {
    name: "苏州",
    nameEn: "Suzhou",
    province: "Jiangsu",
    lat: 31.2990,
    lng: 120.5853,
    summary: "Garden city — classical gardens, canals, and silk.",
    tier: "SECOND",
    isLivable: true,
    places: [
      { name: "拙政园", nameEn: "Humble Administrator's Garden", category: "ATTRACTION", lng: 120.585, lat: 31.324, description: "China's most famous classical garden, a UNESCO site.", priceLevel: 2 },
      { name: "平江路", nameEn: "Pingjiang Road", category: "SHOPPING", lng: 120.581, lat: 31.320, description: "Historic canal-side street with shops and cafes.", priceLevel: 1 },
      { name: "松鼠桂鱼", nameEn: "Squirrel Fish", category: "FOOD", lng: 120.586, lat: 31.318, description: "Famous Suzhou dish with sweet-sour sauce.", priceLevel: 3 },
      { name: "寒山寺", nameEn: "Hanshan Temple", category: "ATTRACTION", lng: 120.580, lat: 31.291, description: "Buddhist temple made famous by Tang poetry.", priceLevel: 2 },
      { name: "周庄", nameEn: "Zhouzhuang", category: "ATTRACTION", lng: 120.892, lat: 31.096, description: "Water town with ancient bridges and canals.", priceLevel: 2 },
    ],
  },
  {
    name: "天津",
    nameEn: "Tianjin",
    province: "Tianjin",
    lat: 39.0842,
    lng: 117.2009,
    summary: "Port city — colonial architecture, seafood, and snacks.",
    tier: "SECOND",
    isLivable: false,
    places: [
      { name: "天津之眼", nameEn: "Tianjin Eye", category: "ATTRACTION", lng: 117.211, lat: 39.128, description: "Giant Ferris wheel on the Hai River.", priceLevel: 2 },
      { name: "五大道", nameEn: "Five Avenues", category: "ATTRACTION", lng: 117.198, lat: 39.088, description: "Area with European-style mansions and gardens.", priceLevel: 1 },
      { name: "狗不理包子", nameEn: "Goubuli Baozi", category: "FOOD", lng: 117.202, lat: 39.092, description: "Famous steamed buns since 1858.", priceLevel: 3 },
      { name: "古文化街", nameEn: "Ancient Culture Street", category: "SHOPPING", lng: 117.207, lat: 39.117, description: "Traditional street with crafts and snacks.", priceLevel: 1 },
      { name: "海河", nameEn: "Hai River", category: "NATURE", lng: 117.200, lat: 39.095, description: "Scenic river with bridges and skyline views.", priceLevel: 1 },
    ],
  },
  {
    name: "长沙",
    nameEn: "Changsha",
    province: "Hunan",
    lat: 28.2280,
    lng: 112.9388,
    summary: "Entertainment capital — spicy cuisine, TV culture, and history.",
    tier: "SECOND",
    isLivable: false,
    places: [
      { name: "橘子洲头", nameEn: "Orange Island", category: "ATTRACTION", lng: 112.939, lat: 28.228, description: "Scenic island in the Xiang River with Mao Zedong statue.", priceLevel: 1 },
      { name: "岳麓山", nameEn: "Yuelu Mountain", category: "NATURE", lng: 112.934, lat: 28.220, description: "Scenic mountain with temples and university.", priceLevel: 1 },
      { name: "臭豆腐", nameEn: "Stinky Tofu", category: "FOOD", lng: 112.937, lat: 28.226, description: "Changsha's famous fermented tofu street food.", priceLevel: 1 },
      { name: "火宫殿", nameEn: "Huogongdian", category: "FOOD", lng: 112.936, lat: 28.225, description: "Famous food palace with Hunan specialties.", priceLevel: 2 },
      { name: "湖南省博物馆", nameEn: "Hunan Museum", category: "ATTRACTION", lng: 112.950, lat: 28.233, description: "Home to the Mawangdui tomb artifacts.", priceLevel: 1 },
    ],
  },
  {
    name: "青岛",
    nameEn: "Qingdao",
    province: "Shandong",
    lat: 36.0671,
    lng: 120.3826,
    summary: "Coastal gem — beer, seafood, and German architecture.",
    tier: "SECOND",
    isLivable: true,
    places: [
      { name: "栈桥", nameEn: "Zhanqiao Pier", category: "ATTRACTION", lng: 120.382, lat: 36.062, description: "Iconic pier extending into the sea.", priceLevel: 1 },
      { name: "崂山", nameEn: "Mount Lao", category: "NATURE", lng: 120.650, lat: 36.140, description: "Coastal mountain with temples and beaches.", priceLevel: 2 },
      { name: "青岛啤酒", nameEn: "Tsingtao Beer", category: "FOOD", lng: 120.368, lat: 36.067, description: "World-famous brewery with beer tasting.", priceLevel: 2 },
      { name: "八大关", nameEn: "Badaguan", category: "ATTRACTION", lng: 120.370, lat: 36.058, description: "Scenic area with European-style villas.", priceLevel: 1 },
      { name: "海鲜大排档", nameEn: "Seafood Street", category: "FOOD", lng: 120.384, lat: 36.056, description: "Fresh seafood restaurants along the coast.", priceLevel: 2 },
    ],
  },
  {
    name: "郑州",
    nameEn: "Zhengzhou",
    province: "Henan",
    lat: 34.7466,
    lng: 113.6253,
    summary: "Central hub — ancient capitals, martial arts, and noodles.",
    tier: "SECOND",
    isLivable: false,
    places: [
      { name: "少林寺", nameEn: "Shaolin Temple", category: "ATTRACTION", lng: 113.058, lat: 34.523, description: "Famous Buddhist temple and birthplace of Kung Fu.", priceLevel: 3 },
      { name: "河南博物院", nameEn: "Henan Museum", category: "ATTRACTION", lng: 113.626, lat: 34.760, description: "One of China's top museums with ancient artifacts.", priceLevel: 1 },
      { name: "烩面", nameEn: "Huimian", category: "FOOD", lng: 113.625, lat: 34.747, description: "Zhengzhou's signature noodle soup dish.", priceLevel: 1 },
      { name: "黄河游览区", nameEn: "Yellow River Scenic Area", category: "NATURE", lng: 113.500, lat: 34.820, description: "Scenic park with views of the Yellow River.", priceLevel: 2 },
      { name: "二七塔", nameEn: "Erqi Memorial Tower", category: "ATTRACTION", lng: 113.626, lat: 34.746, description: "Iconic landmark in downtown Zhengzhou.", priceLevel: 1 },
    ],
  },
  {
    name: "厦门",
    nameEn: "Xiamen",
    province: "Fujian",
    lat: 24.4798,
    lng: 118.0894,
    summary: "Coastal paradise — beaches, tea, and Gulangyu Island.",
    tier: "SECOND",
    isLivable: true,
    places: [
      { name: "鼓浪屿", nameEn: "Gulangyu Island", category: "ATTRACTION", lng: 118.066, lat: 24.440, description: "Car-free island with colonial architecture.", priceLevel: 2 },
      { name: "曾厝垵", nameEn: "Zengcuo'an", category: "FOOD", lng: 118.105, lat: 24.445, description: "Charming coastal village with seafood and cafes.", priceLevel: 1 },
      { name: "南普陀寺", nameEn: "Nanputuo Temple", category: "ATTRACTION", lng: 118.082, lat: 24.458, description: "Ancient Buddhist temple with mountain views.", priceLevel: 1 },
      { name: "环岛路", nameEn: "Island Ring Road", category: "NATURE", lng: 118.100, lat: 24.440, description: "Scenic coastal road perfect for biking.", priceLevel: 1 },
      { name: "沙茶面", nameEn: "Satay Noodles", category: "FOOD", lng: 118.089, lat: 24.479, description: "Xiamen's signature spicy noodle soup.", priceLevel: 1 },
    ],
  },
  {
    name: "昆明",
    nameEn: "Kunming",
    province: "Yunnan",
    lat: 24.8816,
    lng: 102.8329,
    summary: "Spring city — year-round flowers, diverse culture, and fresh air.",
    tier: "SECOND",
    isLivable: true,
    places: [
      { name: "滇池", nameEn: "Dianchi Lake", category: "NATURE", lng: 102.815, lat: 24.818, description: "Scenic lake with views of the Western Hills.", priceLevel: 1 },
      { name: "翠湖公园", nameEn: "Green Lake Park", category: "NATURE", lng: 102.832, lat: 24.887, description: "Beautiful park with lotus flowers.", priceLevel: 1 },
      { name: "过桥米线", nameEn: "Crossing Bridge Rice Noodles", category: "FOOD", lng: 102.833, lat: 24.882, description: "Kunming's famous hot pot-style noodles.", priceLevel: 2 },
      { name: "石林", nameEn: "Stone Forest", category: "NATURE", lng: 103.243, lat: 24.789, description: "Unique limestone formations, a UNESCO site.", priceLevel: 3 },
      { name: "云南民族村", nameEn: "Yunnan Ethnic Village", category: "ATTRACTION", lng: 102.812, lat: 24.825, description: "Cultural village showcasing Yunnan's minorities.", priceLevel: 2 },
    ],
  },
  {
    name: "珠海",
    nameEn: "Zhuhai",
    province: "Guangdong",
    lat: 22.2769,
    lng: 113.5674,
    summary: "Garden city — beaches, islands, and clean air.",
    tier: "SECOND",
    isLivable: true,
    places: [
      { name: "情侣路", nameEn: "Lovers' Road", category: "NATURE", lng: 113.570, lat: 22.277, description: "Scenic coastal promenade.", priceLevel: 1 },
      { name: "长隆海洋王国", nameEn: "Chimelong Ocean Kingdom", category: "ATTRACTION", lng: 113.585, lat: 22.190, description: "World-class marine theme park.", priceLevel: 4 },
      { name: "圆明新园", nameEn: "New Yuanming Palace", category: "ATTRACTION", lng: 113.542, lat: 22.270, description: "Replica of the Old Summer Palace.", priceLevel: 2 },
      { name: "珠海渔女", nameEn: "Zhuhai Fisher Girl", category: "ATTRACTION", lng: 113.565, lat: 22.280, description: "Iconic statue on the coast.", priceLevel: 1 },
      { name: "湾仔海鲜街", nameEn: "Wanzai Seafood Street", category: "FOOD", lng: 113.578, lat: 22.265, description: "Fresh seafood market and restaurants.", priceLevel: 2 },
    ],
  },
  {
    name: "桂林",
    nameEn: "Guilin",
    province: "Guangxi",
    lat: 25.2742,
    lng: 110.2907,
    summary: "Karst peaks and emerald rivers — the postcard landscape of southern China.",
    tier: "THIRD",
    isLivable: false,
    places: [
      { name: "漓江", nameEn: "Li River", category: "NATURE", lng: 110.29, lat: 25.273, description: "Cruise past surreal karst mountains to Yangshuo.", priceLevel: 3 },
      { name: "象鼻山", nameEn: "Elephant Trunk Hill", category: "ATTRACTION", lng: 110.295, lat: 25.262, description: "Guilin's emblem — a hill shaped like a drinking elephant.", priceLevel: 2 },
      { name: "芦笛岩", nameEn: "Reed Flute Cave", category: "NATURE", lng: 110.26, lat: 25.31, description: "A glittering, illuminated limestone cave.", priceLevel: 2 },
      { name: "阳朔西街", nameEn: "Yangshuo West Street", category: "NIGHTLIFE", lng: 110.495, lat: 24.778, description: "Lively pedestrian street of bars, cafes and shops.", priceLevel: 2 },
    ],
  },
  {
    name: "丽江",
    nameEn: "Lijiang",
    province: "Yunnan",
    lat: 26.8658,
    lng: 100.2383,
    summary: "Ancient town — cobblestone streets, Naxi culture, and mountain views.",
    tier: "THIRD",
    isLivable: false,
    places: [
      { name: "丽江古城", nameEn: "Lijiang Old Town", category: "ATTRACTION", lng: 100.238, lat: 26.866, description: "UNESCO-listed ancient town with canals.", priceLevel: 1 },
      { name: "玉龙雪山", nameEn: "Jade Dragon Snow Mountain", category: "NATURE", lng: 100.235, lat: 27.034, description: "Snow-capped mountain with cable car.", priceLevel: 3 },
      { name: "束河古镇", nameEn: "Shuhe Ancient Town", category: "ATTRACTION", lng: 100.252, lat: 26.888, description: "Quieter ancient town near Lijiang.", priceLevel: 2 },
      { name: "纳西美食", nameEn: "Naxi Cuisine", category: "FOOD", lng: 100.239, lat: 26.867, description: "Local dishes including chicken hotpot.", priceLevel: 2 },
      { name: "四方街", nameEn: "Sifang Square", category: "SHOPPING", lng: 100.237, lat: 26.865, description: "Central square with shops and cafes.", priceLevel: 1 },
    ],
  },
  {
    name: "大理",
    nameEn: "Dali",
    province: "Yunnan",
    lat: 25.6018,
    lng: 100.2015,
    summary: "Lake and mountains — Erhai Lake, ancient city, and relaxed vibe.",
    tier: "THIRD",
    isLivable: true,
    places: [
      { name: "洱海", nameEn: "Erhai Lake", category: "NATURE", lng: 100.198, lat: 25.602, description: "Scenic lake with bike paths along the shore.", priceLevel: 1 },
      { name: "大理古城", nameEn: "Dali Old Town", category: "ATTRACTION", lng: 100.202, lat: 25.602, description: "Ancient walled city with traditional architecture.", priceLevel: 1 },
      { name: "苍山", nameEn: "Cangshan Mountains", category: "NATURE", lng: 100.195, lat: 25.615, description: "Scenic mountains with hiking trails.", priceLevel: 2 },
      { name: "喜洲古镇", nameEn: "Xizhou Ancient Town", category: "ATTRACTION", lng: 100.182, lat: 25.633, description: "Historic town with Bai minority culture.", priceLevel: 1 },
      { name: "过桥米线", nameEn: "Guoqiao Mixian", category: "FOOD", lng: 100.202, lat: 25.602, description: "Local specialty rice noodles.", priceLevel: 2 },
    ],
  },
  {
    name: "三亚",
    nameEn: "Sanya",
    province: "Hainan",
    lat: 18.2542,
    lng: 109.5015,
    summary: "Tropical paradise — white sand beaches, warm weather, and seafood.",
    tier: "THIRD",
    isLivable: false,
    places: [
      { name: "亚龙湾", nameEn: "Yalong Bay", category: "NATURE", lng: 109.527, lat: 18.284, description: "Beautiful beach with clear waters.", priceLevel: 2 },
      { name: "天涯海角", nameEn: "Tianya Haijiao", category: "ATTRACTION", lng: 109.488, lat: 18.257, description: "Famous scenic spot with granite boulders.", priceLevel: 2 },
      { name: "蜈支洲岛", nameEn: "Wuzhizhou Island", category: "NATURE", lng: 109.612, lat: 18.308, description: "Tropical island with diving and beaches.", priceLevel: 3 },
      { name: "海鲜大排档", nameEn: "Seafood Market", category: "FOOD", lng: 109.502, lat: 18.254, description: "Fresh tropical seafood.", priceLevel: 2 },
      { name: "鹿回头", nameEn: "Luhuitou", category: "ATTRACTION", lng: 109.516, lat: 18.250, description: "Hill with panoramic views of Sanya.", priceLevel: 2 },
    ],
  },
  {
    name: "威海",
    nameEn: "Weihai",
    province: "Shandong",
    lat: 37.5516,
    lng: 122.1155,
    summary: "Coastal gem — clean beaches, fresh seafood, and relaxed pace.",
    tier: "THIRD",
    isLivable: true,
    places: [
      { name: "刘公岛", nameEn: "Liugong Island", category: "ATTRACTION", lng: 122.118, lat: 37.538, description: "Historic island with museums.", priceLevel: 2 },
      { name: "国际海水浴场", nameEn: "International Beach", category: "NATURE", lng: 122.068, lat: 37.536, description: "Clean beach with swimming and surfing.", priceLevel: 1 },
      { name: "海鲜烧烤", nameEn: "Seafood BBQ", category: "FOOD", lng: 122.116, lat: 37.552, description: "Fresh seafood grilled on the coast.", priceLevel: 2 },
      { name: "环翠楼公园", nameEn: "Huancuilou Park", category: "NATURE", lng: 122.110, lat: 37.558, description: "Park with city views.", priceLevel: 1 },
      { name: "威海港公园", nameEn: "Weihai Port Park", category: "NATURE", lng: 122.118, lat: 37.545, description: "Coastal park with walking trails.", priceLevel: 1 },
    ],
  },
  {
    name: "扬州",
    nameEn: "Yangzhou",
    province: "Jiangsu",
    lat: 32.3807,
    lng: 119.4398,
    summary: "Garden city — classical gardens, dim sum, and poetry.",
    tier: "THIRD",
    isLivable: true,
    places: [
      { name: "瘦西湖", nameEn: "Slender West Lake", category: "ATTRACTION", lng: 119.428, lat: 32.370, description: "Beautiful lake with pagodas and gardens.", priceLevel: 2 },
      { name: "个园", nameEn: "Ge Garden", category: "ATTRACTION", lng: 119.438, lat: 32.393, description: "Famous classical garden with rock formations.", priceLevel: 2 },
      { name: "富春茶社", nameEn: "Fuchun Teahouse", category: "FOOD", lng: 119.439, lat: 32.381, description: "Famous dim sum restaurant since 1885.", priceLevel: 3 },
      { name: "东关街", nameEn: "Dongguan Street", category: "SHOPPING", lng: 119.441, lat: 32.382, description: "Historic street with shops and snacks.", priceLevel: 1 },
      { name: "何园", nameEn: "He Garden", category: "ATTRACTION", lng: 119.450, lat: 32.378, description: "Another beautiful classical garden.", priceLevel: 2 },
    ],
  },
  {
    name: "绍兴",
    nameEn: "Shaoxing",
    province: "Zhejiang",
    lat: 30.0077,
    lng: 120.5853,
    summary: "Water town — canals, rice wine, and literary history.",
    tier: "THIRD",
    isLivable: true,
    places: [
      { name: "鲁迅故里", nameEn: "Lu Xun's Former Residence", category: "ATTRACTION", lng: 120.586, lat: 30.008, description: "Birthplace of famous writer Lu Xun.", priceLevel: 1 },
      { name: "沈园", nameEn: "Shen Garden", category: "ATTRACTION", lng: 120.585, lat: 30.003, description: "Ancient garden with romantic history.", priceLevel: 2 },
      { name: "黄酒", nameEn: "Huangjiu", category: "FOOD", lng: 120.586, lat: 30.008, description: "Shaoxing's famous rice wine.", priceLevel: 2 },
      { name: "乌篷船", nameEn: "Wupeng Boat", category: "ATTRACTION", lng: 120.585, lat: 30.007, description: "Traditional black-awning boat rides.", priceLevel: 2 },
      { name: "仓桥直街", nameEn: "Cangqiao Zhi Street", category: "SHOPPING", lng: 120.583, lat: 30.006, description: "Historic canal-side street.", priceLevel: 1 },
    ],
  },
  {
    name: "泉州",
    nameEn: "Quanzhou",
    province: "Fujian",
    lat: 24.8949,
    lng: 118.6414,
    summary: "Maritime Silk Road hub — historic temples, seafood, and culture.",
    tier: "THIRD",
    isLivable: false,
    places: [
      { name: "开元寺", nameEn: "Kaiyuan Temple", category: "ATTRACTION", lng: 118.638, lat: 24.892, description: "Ancient Buddhist temple with twin pagodas.", priceLevel: 1 },
      { name: "西街", nameEn: "West Street", category: "SHOPPING", lng: 118.639, lat: 24.894, description: "Historic street with shops and snacks.", priceLevel: 1 },
      { name: "泉州小吃", nameEn: "Quanzhou Snacks", category: "FOOD", lng: 118.641, lat: 24.895, description: "Local specialties like oyster omelets.", priceLevel: 1 },
      { name: "洛阳桥", nameEn: "Luoyang Bridge", category: "ATTRACTION", lng: 118.665, lat: 24.928, description: "Ancient stone bridge over the river.", priceLevel: 1 },
      { name: "清净寺", nameEn: "Qingjing Mosque", category: "ATTRACTION", lng: 118.640, lat: 24.893, description: "Ancient Islamic mosque.", priceLevel: 2 },
    ],
  },
  {
    name: "舟山",
    nameEn: "Zhoushan",
    province: "Zhejiang",
    lat: 30.0167,
    lng: 122.2083,
    summary: "Island paradise — seafood, beaches, and Buddhist mountains.",
    tier: "THIRD",
    isLivable: false,
    places: [
      { name: "普陀山", nameEn: "Mount Putuo", category: "ATTRACTION", lng: 122.315, lat: 30.010, description: "Famous Buddhist mountain on an island.", priceLevel: 3 },
      { name: "朱家尖", nameEn: "Zhujiajian", category: "NATURE", lng: 122.250, lat: 29.970, description: "Beautiful beaches and sand sculptures.", priceLevel: 2 },
      { name: "海鲜大餐", nameEn: "Seafood Feast", category: "FOOD", lng: 122.208, lat: 30.017, description: "Fresh seafood from the East China Sea.", priceLevel: 2 },
      { name: "桃花岛", nameEn: "Taohua Island", category: "NATURE", lng: 122.258, lat: 29.915, description: "Scenic island with beaches and forests.", priceLevel: 2 },
    ],
  },
];

const DEMO_USERS = [
  { email: "alex@orientroam.com", name: "Alex", homeCountry: "United States", languages: "en,es", role: "admin" },
  { email: "marie@orientroam.com", name: "Marie", homeCountry: "France", languages: "fr,en" },
  { email: "kenji@orientroam.com", name: "Kenji", homeCountry: "Japan", languages: "ja,en" },
];

// Curated dish menus for iconic FOOD places (keyed by place nameEn). Any FOOD
// place not listed gets GENERIC_DISHES so the section is never empty. Prices in 元.
type SeedDish = { name: string; nameEn: string; priceYuan: number; description?: string };
const DISHES_BY_PLACE: Record<string, SeedDish[]> = {
  "Quanjude Roast Duck": [
    { name: "北京烤鸭", nameEn: "Peking Roast Duck (whole)", priceYuan: 298, description: "Carved tableside, served with pancakes, scallions and hoisin." },
    { name: "鸭架汤", nameEn: "Duck Carcass Soup", priceYuan: 38 },
    { name: "芥末鸭掌", nameEn: "Duck Webs with Mustard", priceYuan: 48 },
  ],
  "Nanxiang Steamed Buns": [
    { name: "蟹粉小笼", nameEn: "Crab & Pork Soup Dumplings", priceYuan: 68, description: "The signature — rich broth inside a delicate skin." },
    { name: "鲜肉小笼", nameEn: "Pork Soup Dumplings", priceYuan: 48 },
    { name: "蟹黄灌汤包", nameEn: "Crab Roe Soup Bun (with straw)", priceYuan: 88 },
  ],
  "Taotaoju": [
    { name: "虾饺", nameEn: "Har Gow (Shrimp Dumplings)", priceYuan: 38 },
    { name: "叉烧包", nameEn: "BBQ Pork Buns", priceYuan: 28 },
    { name: "凤爪", nameEn: "Steamed Chicken Feet", priceYuan: 26 },
    { name: "蛋挞", nameEn: "Egg Tarts", priceYuan: 22 },
  ],
  "Chen Mapo Tofu": [
    { name: "麻婆豆腐", nameEn: "Mapo Tofu", priceYuan: 36, description: "The original — numbing, spicy, and silky." },
    { name: "回锅肉", nameEn: "Twice-Cooked Pork", priceYuan: 48 },
    { name: "夫妻肺片", nameEn: "Sliced Beef & Tripe in Chili Oil", priceYuan: 42 },
  ],
  "Chongqing Hotpot": [
    { name: "毛肚", nameEn: "Beef Tripe", priceYuan: 58 },
    { name: "鸭肠", nameEn: "Duck Intestine", priceYuan: 48 },
    { name: "嫩牛肉", nameEn: "Sliced Beef", priceYuan: 52 },
    { name: "鸳鸯锅底", nameEn: "Half-Spicy (Yuanyang) Broth", priceYuan: 68, description: "Split pot — one mild, one fiery — so everyone can join." },
  ],
  "Muslim Quarter": [
    { name: "肉夹馍", nameEn: "Roujiamo (Chinese Burger)", priceYuan: 15, description: "Stewed meat in a crisp flatbread." },
    { name: "凉皮", nameEn: "Liangpi Cold Noodles", priceYuan: 12 },
    { name: "羊肉泡馍", nameEn: "Lamb Paomo Soup", priceYuan: 35 },
    { name: "羊肉串", nameEn: "Lamb Skewers", priceYuan: 8 },
  ],
  "Hot Dry Noodles": [
    { name: "热干面", nameEn: "Hot Dry Noodles", priceYuan: 12, description: "Sesame-paste noodles — Wuhan's iconic breakfast." },
    { name: "蛋酒", nameEn: "Egg Rice Wine", priceYuan: 8 },
  ],
  "Crossing Bridge Rice Noodles": [
    { name: "过桥米线", nameEn: "Crossing-Bridge Rice Noodles", priceYuan: 38, description: "Tip the raw toppings into the scalding broth yourself." },
    { name: "汽锅鸡", nameEn: "Steam-Pot Chicken", priceYuan: 58 },
  ],
};
const GENERIC_DISHES: SeedDish[] = [
  { name: "招牌菜", nameEn: "House Signature", priceYuan: 48 },
  { name: "本地特色", nameEn: "Local Specialty", priceYuan: 38 },
];

const FOREIGNER_TAG_POOL = [
  "ENGLISH_MENU",
  "PICTURE_MENU",
  "STAFF_ENGLISH",
  "CARD_PAY",
  "MOBILE_PAY",
  "HALAL",
  "VEG_FRIENDLY",
  "ENGLISH_SIGN",
];

async function main() {
  console.log("Seeding Orient Roam...");

  // Idempotent: skip if the database already has data (so re-deploys don't wipe
  // user-generated content). Set SEED_FORCE=1 to force a fresh re-seed.
  const existing = await prisma.user.count().catch(() => 0);
  if (existing > 0 && process.env.SEED_FORCE !== "1") {
    console.log(`Already seeded (${existing} users) — skipping.`);
    return;
  }

  // Clean (order matters for FK constraints).
  await prisma.moderationAction.deleteMany();
  await prisma.report.deleteMany();
  await prisma.postLike.deleteMany();
  await prisma.postTag.deleteMany();
  await prisma.post.deleteMany();
  await prisma.meetupParticipant.deleteMany();
  await prisma.meetup.deleteMany();
  await prisma.poolMember.deleteMany();
  await prisma.groupPool.deleteMany();
  await prisma.communityMember.deleteMany();
  await prisma.community.deleteMany();
  await prisma.message.deleteMany();
  await prisma.conversationMember.deleteMany();
  await prisma.conversation.deleteMany();
  await prisma.favorite.deleteMany();
  await prisma.dishReview.deleteMany();
  await prisma.placeForeignerTag.deleteMany();
  await prisma.dish.deleteMany();
  await prisma.review.deleteMany();
  await prisma.place.deleteMany();
  await prisma.city.deleteMany();
  await prisma.user.deleteMany();

  // Users
  const passwordHash = await bcrypt.hash("password123", 10);
  const users: { id: string }[] = [];
  for (const u of DEMO_USERS) {
    users.push(
      await prisma.user.create({ data: { ...u, passwordHash } }),
    );
  }
  console.log(`  ${users.length} demo users (login with any email + "password123")`);

  // Cities + places
  let placeCount = 0;
  const allPlaceIds: string[] = [];
  const foodPlaces: { id: string; nameEn: string }[] = [];
  for (const c of CITIES) {
    const city = await prisma.city.create({
      data: {
        name: c.name,
        nameEn: c.nameEn,
        province: c.province,
        lat: c.lat,
        lng: c.lng,
        summary: c.summary,
        tier: c.tier,
        isLivable: c.isLivable,
        history: c.history,
        historyEn: c.historyEn,
        culture: c.culture,
        cultureEn: c.cultureEn,
        cuisine: c.cuisine,
        cuisineEn: c.cuisineEn,
        landmarks: c.landmarks,
        landmarksEn: c.landmarksEn,
        stories: c.stories,
        storiesEn: c.storiesEn,
      },
    });
    for (const p of c.places) {
      const place = await prisma.place.create({
        data: {
          name: p.name,
          nameEn: p.nameEn,
          category: p.category,
          cityId: city.id,
          lat: p.lat,
          lng: p.lng,
          address: p.address,
          description: p.description,
          priceLevel: p.priceLevel ?? 2,
        },
      });
      allPlaceIds.push(place.id);
      if (place.category === "FOOD") foodPlaces.push({ id: place.id, nameEn: place.nameEn });
      placeCount++;
    }
  }
  console.log(`  ${CITIES.length} cities, ${placeCount} places`);

  // Seed a few reviews per place so rankings/maps are populated immediately.
  let reviewCount = 0;
  for (const placeId of allPlaceIds) {
    // 1..3 reviewers, ratings skewed positive (3..5).
    const n = 1 + Math.floor(Math.random() * 3);
    const reviewers = [...users].sort(() => Math.random() - 0.5).slice(0, n);
    let sum = 0;
    for (const reviewer of reviewers) {
      const rating = 3 + Math.floor(Math.random() * 3); // 3,4,5
      sum += rating;
      await prisma.review.create({
        data: {
          userId: reviewer.id,
          placeId,
          rating,
          comment: ["Loved it!", "Worth a visit.", "Great experience.", "Highly recommend."][
            Math.floor(Math.random() * 4)
          ],
        },
      });
      reviewCount++;
    }
    const avg = sum / n;
    await prisma.place.update({
      where: { id: placeId },
      data: {
        avgRating: avg,
        reviewCount: n,
        weightScore: computeWeightScore(avg, n),
      },
    });
  }
  console.log(`  ${reviewCount} reviews (weight scores computed)`);

  // Dishes + dish-level reviews + foreigner-friendly tag votes for FOOD places.
  let dishCount = 0;
  let dishReviewCount = 0;
  let ffTagCount = 0;
  for (const fp of foodPlaces) {
    const menu = DISHES_BY_PLACE[fp.nameEn] ?? GENERIC_DISHES;
    for (const d of menu) {
      const dish = await prisma.dish.create({
        data: {
          placeId: fp.id,
          name: d.name,
          nameEn: d.nameEn,
          description: d.description ?? null,
          priceCents: Math.round(d.priceYuan * 100),
          createdById: users[0].id,
        },
      });
      dishCount++;

      // 1..3 reviewers per dish, positive-skewed; some 5★ flagged must-try.
      const n = 1 + Math.floor(Math.random() * 3);
      const reviewers = [...users].sort(() => Math.random() - 0.5).slice(0, n);
      let sum = 0;
      let mustTryCount = 0;
      for (const reviewer of reviewers) {
        const rating = 3 + Math.floor(Math.random() * 3); // 3,4,5
        const mustTry = rating === 5 && Math.random() < 0.6;
        if (mustTry) mustTryCount++;
        sum += rating;
        await prisma.dishReview.create({
          data: {
            userId: reviewer.id,
            dishId: dish.id,
            rating,
            mustTry,
            comment: ["So good!", "Must order.", "Tasty and authentic.", "Worth it."][
              Math.floor(Math.random() * 4)
            ],
          },
        });
        dishReviewCount++;
      }
      await prisma.dish.update({
        where: { id: dish.id },
        data: { avgRating: sum / n, reviewCount: n, mustTryCount },
      });
    }

    // 2..4 foreigner-friendly tags, each confirmed by 1..N demo users.
    const chosen = [...FOREIGNER_TAG_POOL]
      .sort(() => Math.random() - 0.5)
      .slice(0, 2 + Math.floor(Math.random() * 3));
    for (const tag of chosen) {
      const voters = [...users]
        .sort(() => Math.random() - 0.5)
        .slice(0, 1 + Math.floor(Math.random() * users.length));
      for (const voter of voters) {
        await prisma.placeForeignerTag.create({
          data: { placeId: fp.id, userId: voter.id, tag },
        });
        ffTagCount++;
      }
    }
  }
  console.log(
    `  ${dishCount} dishes, ${dishReviewCount} dish reviews, ${ffTagCount} foreigner-tag votes`,
  );

  // A demo community + meetup so the social pages aren't empty.
  const beijing = await prisma.city.findFirst({ where: { nameEn: "Beijing" } });
  const community = await prisma.community.create({
    data: {
      name: "Beijing Newcomers",
      description: "Tips, buddies and meetups for travelers new to Beijing.",
      cityId: beijing?.id,
      ownerId: users[0].id,
      members: {
        create: users.map((u) => ({ userId: u.id })),
      },
    },
  });

  // Upcoming MEAL meetups, each tied to a real restaurant so the 约饭 flow
  // (restaurant link + foreigner-friendly tags) is visible out of the box.
  const day = 24 * 60 * 60 * 1000;
  const SEED_MEETUPS: {
    placeName: string;
    title: string;
    description: string;
    hostIdx: number;
    inDays: number;
    maxPeople: number;
  }[] = [
    {
      placeName: "Quanjude Roast Duck",
      title: "Peking duck dinner — split the bill!",
      description: "Looking for 2-3 people to share a whole roast duck. English menu, super foreigner-friendly.",
      hostIdx: 1,
      inDays: 2,
      maxPeople: 4,
    },
    {
      placeName: "Nanxiang Steamed Buns",
      title: "Xiaolongbao crawl in Shanghai 🥟",
      description: "First time trying soup dumplings? Join me — I'll show you how to eat them without burning your tongue.",
      hostIdx: 0,
      inDays: 3,
      maxPeople: 5,
    },
    {
      placeName: "Chen Mapo Tofu",
      title: "Sichuan spice night 🌶️",
      description: "Mapo tofu at its birthplace. We can order mild dishes too if you can't handle the heat!",
      hostIdx: 2,
      inDays: 5,
      maxPeople: 6,
    },
    {
      placeName: "Muslim Quarter",
      title: "Xi'an street-food tour (halal)",
      description: "Roujiamo, liangpi, lamb skewers — let's eat our way down the Muslim Quarter.",
      hostIdx: 0,
      inDays: 1,
      maxPeople: 4,
    },
  ];

  let meetupCount = 0;
  for (const sm of SEED_MEETUPS) {
    const place = await prisma.place.findFirst({
      where: { nameEn: sm.placeName },
      select: { id: true, cityId: true },
    });
    if (!place) continue;
    const host = users[sm.hostIdx];
    await prisma.meetup.create({
      data: {
        type: "MEAL",
        title: sm.title,
        description: sm.description,
        cityId: place.cityId,
        placeId: place.id,
        hostId: host.id,
        maxPeople: sm.maxPeople,
        startTime: new Date(Date.now() + sm.inDays * day + 19 * 60 * 60 * 1000),
        participants: { create: [{ userId: host.id }] },
      },
    });
    meetupCount++;
  }
  console.log(`  1 community (${community.name}) + ${meetupCount} meetups`);

  // A few demo feed posts so the community信息流 isn't empty. The #hashtags in
  // each body match the tag names so the /topic pages resolve.
  const demoPosts: { authorId: string; body: string; cityId?: string; tags: string[] }[] = [
    {
      authorId: users[0].id,
      body: "Climbed the Great Wall at sunrise — unreal views and almost no crowds. Go early! #beijing #greatwall",
      cityId: beijing?.id,
      tags: ["beijing", "greatwall"],
    },
    {
      authorId: users[1].id,
      body: "Best Peking duck I found was a tiny spot near Houhai, not the touristy chains. #beijing #foodie",
      cityId: beijing?.id,
      tags: ["beijing", "foodie"],
    },
    {
      authorId: users[2].id,
      body: "想找搭子周末逛胡同 + 喝豆汁儿,有同好吗? #北京 #citywalk",
      cityId: beijing?.id,
      tags: ["北京", "citywalk"],
    },
    {
      authorId: users[0].id,
      body: "Pro tip: grab a transit card on day one — saves so much hassle on the subway. #traveltips",
      tags: ["traveltips"],
    },
  ];
  for (const dp of demoPosts) {
    await prisma.post.create({
      data: {
        authorId: dp.authorId,
        body: dp.body,
        cityId: dp.cityId ?? null,
        tags: {
          create: dp.tags.map((name) => ({
            tag: { connectOrCreate: { where: { name }, create: { name } } },
          })),
        },
      },
    });
  }
  console.log(`  ${demoPosts.length} demo posts`);

  // Demo group pools — one already formed, one still gathering.
  const shanghai = await prisma.city.findFirst({ where: { nameEn: "Shanghai" } });
  const nanxiang = await prisma.place.findFirst({ where: { nameEn: "Nanxiang Steamed Buns" }, select: { id: true } });
  const POOLS = [
    {
      title: "Costco Shanghai bulk run — split a membership haul",
      description: "Driving to Costco this weekend. Let's split bulk packs (cheese, nuts, wine). 4 people to make it worth the trip.",
      cityId: shanghai?.id ?? null,
      placeId: null as string | null,
      unitPriceYuan: 150,
      targetPeople: 4,
      organizerIdx: 0,
      joinIdx: [1] as number[],
      inDays: 4,
    },
    {
      title: "Group dim sum at Nanxiang — book the big table",
      description: "Need 6 to reserve the round banquet table and order the full menu. Already 2 in!",
      cityId: shanghai?.id ?? null,
      placeId: nanxiang?.id ?? null,
      unitPriceYuan: 120,
      targetPeople: 6,
      organizerIdx: 1,
      joinIdx: [0, 2] as number[],
      inDays: 6,
    },
  ];
  let poolCount = 0;
  for (const sp of POOLS) {
    await prisma.groupPool.create({
      data: {
        organizerId: users[sp.organizerIdx].id,
        title: sp.title,
        description: sp.description,
        cityId: sp.cityId,
        placeId: sp.placeId,
        unitPriceCents: Math.round(sp.unitPriceYuan * 100),
        targetPeople: sp.targetPeople,
        deadline: new Date(Date.now() + sp.inDays * day),
        members: {
          create: [
            { userId: users[sp.organizerIdx].id },
            ...sp.joinIdx.map((i) => ({ userId: users[i].id })),
          ],
        },
      },
    });
    poolCount++;
  }
  console.log(`  ${poolCount} demo pools`);

  // A couple of open reports so the moderation queue isn't empty.
  const someReview = await prisma.review.findFirst({ select: { id: true } });
  const somePost = await prisma.post.findFirst({ select: { id: true } });
  if (someReview) {
    await prisma.report.create({
      data: { reporterId: users[2].id, targetType: "REVIEW", targetId: someReview.id, reason: "SPAM", detail: "Looks like an ad." },
    });
  }
  if (somePost) {
    await prisma.report.create({
      data: { reporterId: users[1].id, targetType: "POST", targetId: somePost.id, reason: "INAPPROPRIATE" },
    });
  }
  console.log("  2 demo reports");

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
