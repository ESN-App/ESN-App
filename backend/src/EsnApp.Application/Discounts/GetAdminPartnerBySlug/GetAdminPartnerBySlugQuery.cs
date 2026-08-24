using EsnApp.Application.Common;
using EsnApp.Application.Discounts.Common;
using MediatR;

namespace EsnApp.Application.Discounts.GetAdminPartnerBySlug;

public record GetAdminPartnerBySlugQuery(string Slug) : IRequest<Result<PartnerDto>>;
