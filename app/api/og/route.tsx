import { ImageResponse } from "@vercel/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const title = searchParams.get("title") ?? "推しシェア";
  const vtuber = searchParams.get("vtuber") ?? "";
  const comment = searchParams.get("comment") ?? "";
  const type = searchParams.get("type") ?? "stream";
  const rating = Number(searchParams.get("rating") ?? "0");
  const likes = searchParams.get("likes") ?? "0";
  const thumbnail = searchParams.get("thumbnail") ?? "";

  const typeLabels: Record<string, string> = {
    stream: "本配信",
    clip: "切り抜き",
    x_clip: "Xクリップ",
  };
  const typeLabel = typeLabels[type] ?? "本配信";

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          background: "linear-gradient(135deg, #1a1025 0%, #0f0a15 50%, #150d1e 100%)",
          fontFamily: "sans-serif",
          color: "white",
          position: "relative",
        }}
      >
        {/* 背景グラデーション */}
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: "600px",
            height: "630px",
            background:
              "radial-gradient(circle at top right, rgba(147, 51, 234, 0.15), transparent 70%)",
            display: "flex",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            display: "flex",
            width: "100%",
            padding: "48px",
            gap: "40px",
          }}
        >
          {/* 左側: サムネイル */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              width: "480px",
              flexShrink: 0,
            }}
          >
            {thumbnail ? (
              <img
                src={thumbnail}
                alt=""
                width={480}
                height={270}
                style={{
                  borderRadius: "16px",
                  objectFit: "cover",
                  border: "2px solid rgba(147, 51, 234, 0.3)",
                }}
              />
            ) : (
              <div
                style={{
                  width: "480px",
                  height: "270px",
                  borderRadius: "16px",
                  background: "rgba(147, 51, 234, 0.1)",
                  border: "2px solid rgba(147, 51, 234, 0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "24px",
                  color: "rgba(255,255,255,0.3)",
                }}
              >
                No Thumbnail
              </div>
            )}
          </div>

          {/* 右側: テキスト情報 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              gap: "16px",
            }}
          >
            {/* バッジ */}
            <div style={{ display: "flex", gap: "8px" }}>
              <div
                style={{
                  background: "rgba(147, 51, 234, 0.3)",
                  color: "#c084fc",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "14px",
                  fontWeight: 600,
                }}
              >
                {typeLabel}
              </div>
            </div>

            {/* VTuber名 */}
            {vtuber && (
              <div
                style={{
                  fontSize: "18px",
                  color: "#c084fc",
                  fontWeight: 600,
                }}
              >
                {vtuber}
              </div>
            )}

            {/* タイトル */}
            <div
              style={{
                fontSize: "28px",
                fontWeight: 700,
                lineHeight: 1.3,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {title}
            </div>

            {/* コメント */}
            {comment && (
              <div
                style={{
                  fontSize: "16px",
                  color: "rgba(255,255,255,0.6)",
                  lineHeight: 1.5,
                  display: "-webkit-box",
                  WebkitLineClamp: 3,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {comment}
              </div>
            )}

            {/* 評価 & いいね */}
            <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
              {rating > 0 && (
                <div style={{ display: "flex", gap: "2px" }}>
                  {Array.from({ length: 5 }).map((_, i) => (
                    <span
                      key={i}
                      style={{
                        fontSize: "20px",
                        color: i < rating ? "#facc15" : "rgba(255,255,255,0.2)",
                      }}
                    >
                      ★
                    </span>
                  ))}
                </div>
              )}
              {Number(likes) > 0 && (
                <div
                  style={{
                    fontSize: "16px",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  👍 {likes}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ロゴ */}
        <div
          style={{
            position: "absolute",
            bottom: "24px",
            right: "48px",
            fontSize: "20px",
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <span
            style={{
              background: "linear-gradient(135deg, #a855f7, #ec4899)",
              backgroundClip: "text",
              color: "transparent",
            }}
          >
            推しシェア
          </span>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
      headers: {
        "Cache-Control": "public, max-age=3600, s-maxage=86400",
      },
    }
  );
}
